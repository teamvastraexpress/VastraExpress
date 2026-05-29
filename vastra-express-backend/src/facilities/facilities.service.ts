import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CreateFacilityDto,
  UpdateFacilityDto,
} from './dto/facility.dto';

@Injectable()
export class FacilitiesService {
  private readonly logger = new Logger(FacilitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CITIES ─────────────────────────────────────────────────────────────────

  async getCities(includeInactive = false) {
    return this.prisma.city.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCity(dto: CreateCityDto) {
    const exists = await this.prisma.city.findFirst({
      where: { name: dto.name },
    });
    if (exists) throw new ConflictException('A city with this name already exists');
    return this.prisma.city.create({ data: dto });
  }

  async updateCity(id: number, dto: UpdateCityDto) {
    await this.findCityOrThrow(id);
    return this.prisma.city.update({ where: { id }, data: dto });
  }

  // ─── FACILITIES ──────────────────────────────────────────────────────────────

  async getFacilities(includeInactive = false, user?: { role: string; facilityId?: number | null }) {
    const where: Record<string, unknown> = includeInactive ? {} : { isActive: true };

    if (user && ['FACILITY_STAFF', 'DRIVER'].includes(user.role)) {
      if (!user.facilityId) {
        throw new ForbiddenException('Facility assignment required');
      }
      where.id = user.facilityId;
    }

    return this.prisma.facility.findMany({
      where,
      include: {
        city: true,
        staff: {
          include: {
            user: { select: { id: true, name: true, mobileNumber: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Public endpoint – returns active facilities with city info only (no staff). */
  async getPublicFacilities() {
    return this.prisma.facility.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        facilityCode: true,
        address: true,
        latitude: true,
        longitude: true,
        contactNumber: true,
        isActive: true,
        city: { select: { id: true, name: true, state: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFacility(dto: CreateFacilityDto) {
    const city = await this.findCityOrThrow(dto.cityId);

    // Generate unique facilityCode: CITYNAME_NN (e.g. MUMBAI_01)
    const facilityCode = await this.generateFacilityCode(city.name, dto.name);

    // Validate staff users if provided
    if (dto.staffUserIds?.length) {
      await this.validateStaffUsers(dto.staffUserIds);
    }

    const { staffUserIds, ...facilityData } = dto;

    const facility = await this.prisma.$transaction(async (tx) => {
      const created = await tx.facility.create({
        data: { ...facilityData, facilityCode },
        include: { city: true },
      });

      // Assign staff to this facility
      if (staffUserIds?.length) {
        await tx.staff.updateMany({
          where: { userId: { in: staffUserIds } },
          data: { facilityId: created.id },
        });
      }

      return created;
    });

    this.logger.log(`✅ Facility created: ${facilityCode}`);

    return this.prisma.facility.findUnique({
      where: { id: facility.id },
      include: {
        city: true,
        staff: { include: { user: { select: { id: true, name: true, mobileNumber: true } } } },
      },
    });
  }

  async updateFacility(id: number, dto: UpdateFacilityDto) {
    await this.findFacilityOrThrow(id);
    if (dto.cityId) await this.findCityOrThrow(dto.cityId);

    if ((dto.latitude !== undefined) !== (dto.longitude !== undefined)) {
      throw new BadRequestException('Both latitude and longitude are required to update location');
    }

    const { staffUserIds, ...facilityData } = dto as UpdateFacilityDto & { staffUserIds?: number[] };

    if (staffUserIds?.length) {
      await this.validateStaffUsers(staffUserIds);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.facility.update({
        where: { id },
        data: facilityData,
      });

      if (staffUserIds !== undefined) {
        // Unassign all current staff from this facility
        await tx.staff.updateMany({ where: { facilityId: id }, data: { facilityId: null } });
        // Reassign selected staff
        if (staffUserIds.length) {
          await tx.staff.updateMany({
            where: { userId: { in: staffUserIds } },
            data: { facilityId: id },
          });
        }
      }
    });

    return this.prisma.facility.findUnique({
      where: { id },
      include: {
        city: true,
        staff: { include: { user: { select: { id: true, name: true, mobileNumber: true } } } },
      },
    });
  }

  async toggleFacilityStatus(id: number, isActive: boolean) {
    await this.findFacilityOrThrow(id);
    return this.prisma.facility.update({
      where: { id },
      data: { isActive },
      include: { city: true },
    });
  }

  /** GET /facilities/staff — list all FACILITY_STAFF + DRIVER users (for dropdown) */
  async getFacilityStaff() {
    const staffList = await this.prisma.staff.findMany({
      where: {
        user: { role: { name: { in: ['FACILITY_STAFF', 'DRIVER'] } } },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
            isActive: true,
            role: { select: { name: true } },
          },
        },
        facility: { select: { id: true, name: true, facilityCode: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return staffList.map((s) => ({
      staffId: s.id,
      userId: s.userId,
      employeeId: s.employeeId,
      name: s.user.name,
      mobileNumber: s.user.mobileNumber,
      role: s.user.role?.name ?? null,
      isActive: s.user.isActive,
      currentFacility: s.facility
        ? { id: s.facility.id, name: s.facility.name, code: s.facility.facilityCode }
        : null,
    }));
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  /**
   * Generate a unique facility code from city + facility name.
   * Format: CITYNAME_NN  e.g. MUMBAI_01, DELHI_02
   * Strips non-alphanumeric characters, caps at 20 chars, pads sequence.
   */
  private async generateFacilityCode(cityName: string, facilityName: string): Promise<string> {
    // Use first significant word of facility name for the slug
    const slug = facilityName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('_')
      .substring(0, 20);

    const base = slug || cityName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);

    // Count existing facilities whose code starts with this base
    const existing = await this.prisma.facility.count({
      where: { facilityCode: { startsWith: base + '_' } },
    });

    const seq = String(existing + 1).padStart(2, '0');
    return `${base}_${seq}`;
  }

  private async validateStaffUsers(userIds: number[]) {
    const staffRows = await this.prisma.staff.findMany({
      where: { userId: { in: userIds } },
      include: { user: { select: { id: true, isActive: true, role: { select: { name: true } } } } },
    });

    if (staffRows.length !== userIds.length) {
      const found = staffRows.map((s) => s.userId);
      const missing = userIds.filter((id) => !found.includes(id));
      throw new BadRequestException(`Staff record not found for user IDs: ${missing.join(', ')}`);
    }

    const allowedRoles = new Set(['FACILITY_STAFF', 'DRIVER']);
    const invalid = staffRows.filter((s) => !allowedRoles.has(s.user.role.name));
    if (invalid.length) {
      throw new BadRequestException(
        `The following users are not assignable staff: ${invalid.map((s) => s.userId).join(', ')}`,
      );
    }
  }

  private async findCityOrThrow(id: number) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException(`City #${id} not found`);
    return city;
  }

  private async findFacilityOrThrow(id: number) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) throw new NotFoundException(`Facility #${id} not found`);
    return facility;
  }
}
