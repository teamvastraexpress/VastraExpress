import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';

@Injectable()
export class PickupSlotsService {
  private readonly logger = new Logger(PickupSlotsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a pickup slot (Admin/Facility Staff only)
   */
  async create(dto: CreateSlotDto, userRole: string, userFacilityId?: number) {
    // FACILITY_STAFF can only create slots for their own facility
    if (userRole === 'FACILITY_STAFF' && userFacilityId !== dto.facilityId) {
      throw new ForbiddenException('You can only create slots for your own facility');
    }

    // Validate facility
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility || !facility.isActive) {
      throw new NotFoundException(`Facility #${dto.facilityId} not found or inactive`);
    }

    // Validate time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // Prevent creating slots in the past
    const slotDate = new Date(dto.slotDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      throw new BadRequestException('Cannot create pickup slots in the past');
    }

    const slot = await this.prisma.pickupSlot.create({
      data: {
        facilityId: dto.facilityId,
        slotDate: new Date(dto.slotDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxCapacity: dto.maxCapacity ?? 10,
        currentBookings: 0,
        isActive: dto.isActive ?? true,
      },
      include: { facility: { select: { id: true, name: true } } },
    });

    this.logger.log(`✅ Pickup slot created for facility ${dto.facilityId} on ${dto.slotDate}`);
    return this.formatSlot(slot);
  }

  /**
   * Get available slots (public - for customers booking orders)
   * Business Rule: Slots disappear exactly 1 hour before their start time (IST).
   */
  async getAvailable(query: GetAvailableSlotsDto) {
    // Default to today in IST if no date provided
    const dateStr = query.date ?? new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const slots = await this.prisma.pickupSlot.findMany({
      where: {
        slotDate: new Date(dateStr),
        isActive: true,
        ...(query.facilityId && { facilityId: query.facilityId }),
      },
      include: {
        facility: { select: { id: true, name: true, city: { select: { name: true } } } },
      },
      orderBy: [{ facilityId: 'asc' }, { startTime: 'asc' }],
    });

    // Filter out fully booked slots AND slots within 1 hour of start (IST).
    // BUG FIX: Use new Date() directly (UTC) for 'now'. The cutoff is already a
    // proper UTC instant (built from ISO string with +05:30 offset), so comparing
    // new Date() < cutoff is correct and timezone-safe.
    const now = new Date();

    const available = slots.filter((s) => {
      // Capacity check
      if (s.currentBookings >= (s.maxCapacity ?? 10)) return false;

      // 1-hour cutoff: build slot start as a UTC instant using explicit IST offset
      const slotDateStr = new Date(s.slotDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });      const slotDT = new Date(`${slotDateStr}T${s.startTime}:00+05:30`);
      const cutoff = new Date(slotDT.getTime() - 60 * 60 * 1000); // 1 hour before slot start

      return now < cutoff;
    });

    return available.map(s => ({
      ...this.formatSlot(s),
      availableCapacity: (s.maxCapacity ?? 10) - s.currentBookings,
    }));
  }

  /**
   * List all slots with filters (Admin/Facility Staff)
   */
  async findAll(
    userRole: string,
    userFacilityId?: number,
    facilityId?: number,
    date?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    // FACILITY_STAFF can only see their own facility's slots
    const resolvedFacilityId =
      userRole === 'FACILITY_STAFF' ? userFacilityId : facilityId;

    const where = {
      ...(resolvedFacilityId && { facilityId: resolvedFacilityId }),
      ...(date && { slotDate: new Date(date) }),
    };

    const [slots, total] = await Promise.all([
      this.prisma.pickupSlot.findMany({
        where,
        include: {
          facility: { select: { id: true, name: true } },
        },
        orderBy: [{ slotDate: 'desc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.pickupSlot.count({ where }),
    ]);

    return {
      data: slots.map(s => ({
        ...this.formatSlot(s),
        availableCapacity: (s.maxCapacity ?? 10) - s.currentBookings,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update a pickup slot (Admin/Facility Staff)
   */
  async update(
    slotId: number,
    dto: UpdateSlotDto,
    userRole: string,
    userFacilityId?: number,
  ) {
    const slot = await this.prisma.pickupSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException(`Slot #${slotId} not found`);

    // FACILITY_STAFF can only update their own facility's slots
    if (userRole === 'FACILITY_STAFF' && slot.facilityId !== userFacilityId) {
      throw new ForbiddenException('You can only update slots for your own facility');
    }

    // Cannot reduce capacity below current bookings
    if (dto.maxCapacity !== undefined && dto.maxCapacity < slot.currentBookings) {
      throw new BadRequestException(
        `Cannot set capacity below current bookings (${slot.currentBookings})`,
      );
    }

    // Validate time range
    const newStart = dto.startTime ?? slot.startTime;
    const newEnd = dto.endTime ?? slot.endTime;
    if (newStart >= newEnd) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const updated = await this.prisma.pickupSlot.update({
      where: { id: slotId },
      data: {
        ...(dto.slotDate && { slotDate: new Date(dto.slotDate) }),
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { facility: { select: { id: true, name: true } } },
    });

    return this.formatSlot(updated);
  }

  /**
   * Toggle a pickup slot's active/inactive status (Admin/Facility Staff)
   */
  async toggleStatus(slotId: number, userRole: string, userFacilityId?: number) {
    const slot = await this.prisma.pickupSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException(`Slot #${slotId} not found`);

    if (userRole === 'FACILITY_STAFF' && slot.facilityId !== userFacilityId) {
      throw new ForbiddenException('You can only manage slots for your own facility');
    }

    const updated = await this.prisma.pickupSlot.update({
      where: { id: slotId },
      data: { isActive: !slot.isActive },
      include: { facility: { select: { id: true, name: true } } },
    });

    this.logger.log(`✅ Slot #${slotId} toggled to ${updated.isActive ? 'active' : 'inactive'}`);
    return this.formatSlot(updated);
  }

  /**
   * Delete a pickup slot (Admin/Facility Staff)
   */
  async remove(slotId: number, userRole: string, userFacilityId?: number) {
    const slot = await this.prisma.pickupSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException(`Slot #${slotId} not found`);

    // FACILITY_STAFF can only delete their own facility's slots
    if (userRole === 'FACILITY_STAFF' && slot.facilityId !== userFacilityId) {
      throw new ForbiddenException('You can only delete slots for your own facility');
    }

    // Cannot delete slot with existing bookings
    if (slot.currentBookings > 0) {
      throw new BadRequestException(
        `Cannot delete slot with ${slot.currentBookings} existing booking(s). Deactivate it instead.`,
      );
    }

    await this.prisma.pickupSlot.delete({ where: { id: slotId } });

    this.logger.log(`✅ Pickup slot ${slotId} deleted`);
    return { message: 'Pickup slot deleted successfully' };
  }

  /**
   * Block or unblock ALL slots for a specific date + facility in one call.
   * block=true  → set isActive=false on every slot for that day
   * block=false → set isActive=true  on every slot for that day
   */
  async blockDay(
    date: string,
    facilityId: number | undefined,
    block: boolean,
    userRole: string,
    userFacilityId?: number,
  ): Promise<{ message: string; affected: number }> {
    if (!date) throw new BadRequestException('date is required');

    // FACILITY_STAFF always operates on their own facility
    const resolvedFacilityId =
      userRole === 'FACILITY_STAFF' ? userFacilityId : facilityId;

    if (!resolvedFacilityId) {
      throw new BadRequestException('facilityId is required');
    }

    const slotDate = new Date(date);

    const result = await this.prisma.pickupSlot.updateMany({
      where: { facilityId: resolvedFacilityId, slotDate: slotDate },
      data: { isActive: !block },
    });

    const action = block ? 'blocked' : 'unblocked';
    this.logger.log(
      `✅ Day ${date} ${action} for facility #${resolvedFacilityId} — ${result.count} slots affected`,
    );

    return {
      message: `${result.count} slot(s) ${action} for ${date}`,
      affected: result.count,
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private formatSlot(slot: any) {
    return {
      id: slot.id,
      facility: slot.facility ?? null,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      isActive: slot.isActive,
    };
  }
}
