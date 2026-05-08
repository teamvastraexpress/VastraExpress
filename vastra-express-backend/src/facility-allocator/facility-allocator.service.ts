import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { boundingBox, haversineDistanceKm } from '../common/geo';

const MAX_SERVICE_DISTANCE_KM = 5;

interface FacilityOptionSlot {
  id: number;
  startTime: string;
  endTime: string;
  availableCapacity: number;
}

export interface FacilityOption {
  facilityId: number;
  name: string;
  distanceKm: number;
  loadRatio: number;
  availableSlots: FacilityOptionSlot[];
}

export interface FacilityOptionsResult {
  serviceable: boolean;
  message?: string;
  options: FacilityOption[];
}

@Injectable()
export class FacilityAllocatorService {
  constructor(private readonly prisma: PrismaService) {}

  async getFacilityOptions(
    userId: number,
    addressId: number,
    pickupDate: string,
  ): Promise<FacilityOptionsResult> {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException('You do not own this address');

    const customerLat = Number(address.latitude);
    const customerLng = Number(address.longitude);
    if (!Number.isFinite(customerLat) || !Number.isFinite(customerLng)) {
      throw new BadRequestException('GPS coordinates missing for address');
    }

    const { minLat, maxLat, minLng, maxLng } = boundingBox(
      customerLat,
      customerLng,
      MAX_SERVICE_DISTANCE_KM,
    );

    const facilities = await this.prisma.facility.findMany({
      where: {
        isActive: true,
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });

    if (facilities.length === 0) {
      return {
        serviceable: false,
        message: 'Service not available in your area yet.',
        options: [],
      };
    }

    const slotDate = new Date(pickupDate);
    const slots = await this.prisma.pickupSlot.findMany({
      where: {
        slotDate,
        isActive: true,
        facilityId: { in: facilities.map((f) => f.id) },
      },
      select: {
        id: true,
        facilityId: true,
        slotDate: true,
        startTime: true,
        endTime: true,
        maxCapacity: true,
        currentBookings: true,
      },
      orderBy: [{ facilityId: 'asc' }, { startTime: 'asc' }],
    });

    const now = new Date();

    const totals = new Map<number, { capacity: number; bookings: number }>();
    const availableByFacility = new Map<number, FacilityOptionSlot[]>();

    for (const slot of slots) {
      const maxCap = slot.maxCapacity ?? 10;
      const availableCapacity = maxCap - slot.currentBookings;

      const slotDateStr = new Date(slot.slotDate).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const slotDT = new Date(`${slotDateStr}T${slot.startTime}:00+05:30`);
      const cutoff = new Date(slotDT.getTime() - 60 * 60 * 1000);

      const current = totals.get(slot.facilityId) ?? { capacity: 0, bookings: 0 };
      current.capacity += maxCap;
      current.bookings += slot.currentBookings;
      totals.set(slot.facilityId, current);

      if (availableCapacity > 0 && now < cutoff) {
        const list = availableByFacility.get(slot.facilityId) ?? [];
        list.push({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          availableCapacity,
        });
        availableByFacility.set(slot.facilityId, list);
      }
    }

    const options: FacilityOption[] = [];

    for (const facility of facilities) {
      const facilityLat = Number(facility.latitude);
      const facilityLng = Number(facility.longitude);
      const distanceKm = haversineDistanceKm(
        customerLat,
        customerLng,
        facilityLat,
        facilityLng,
      );

      if (distanceKm > MAX_SERVICE_DISTANCE_KM) continue;

      const totalsForFacility = totals.get(facility.id);
      if (!totalsForFacility || totalsForFacility.capacity === 0) continue;
      if (totalsForFacility.bookings >= totalsForFacility.capacity) continue;

      const availableSlots = availableByFacility.get(facility.id) ?? [];
      if (availableSlots.length === 0) continue;

      const loadRatio = totalsForFacility.bookings / totalsForFacility.capacity;

      options.push({
        facilityId: facility.id,
        name: facility.name,
        distanceKm: Number(distanceKm.toFixed(1)),
        loadRatio,
        availableSlots,
      });
    }

    options.sort((a, b) => {
      const dist = a.distanceKm - b.distanceKm;
      if (dist !== 0) return dist;
      return a.loadRatio - b.loadRatio;
    });

    return {
      serviceable: options.length > 0,
      message: options.length > 0 ? undefined : 'Service not available in your area yet.',
      options,
    };
  }
}
