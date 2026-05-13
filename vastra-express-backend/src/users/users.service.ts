import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

interface CurrentUser {
  userId: number;
  role: string;
  facilityId?: number | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
  ) {}

  // ─── CUSTOMER ENDPOINTS ───────────────────────────────────────────────────

  /**
   * Get full profile of current user
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        staffProfile: { include: { facility: true } },
        addresses: {
          include: { city: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return this.formatUserResponse(user);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.fcmToken !== undefined && { fcmToken: dto.fcmToken }),
      },
      include: { role: true },
    });

    this.logger.log(`✅ Profile updated for user ${userId}`);
    return this.formatUserResponse(updated);
  }

  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────

  /**
   * List all users with pagination (Admin only)
   */
  async findAll(page = 1, limit = 20, role?: string) {
    const skip = (page - 1) * limit;

    const where = role
      ? { role: { name: role } }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true, staffProfile: { include: { facility: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(u => this.formatUserResponse(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List drivers for admin or facility staff (facility-scoped).
   */
  async getDrivers(user: CurrentUser) {
    if (user.role === 'FACILITY_STAFF' && !user.facilityId) {
      throw new ForbiddenException('Facility assignment required');
    }

    const where: Record<string, unknown> = {
      role: { name: 'DRIVER' },
    };

    if (user.role === 'FACILITY_STAFF') {
      where.staffProfile = { facilityId: user.facilityId };
    }

    const drivers = await this.prisma.user.findMany({
      where,
      include: { role: true, staffProfile: { include: { facility: true } } },
      orderBy: { name: 'asc' },
    });

    return drivers.map((d) => this.formatUserResponse(d));
  }

  /**
   * Get specific user by ID (Admin only)
   */
  async findById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        addresses: { include: { city: true } },
        staffProfile: { include: { facility: true } },
      },
    });

    if (!user) throw new NotFoundException(`User #${userId} not found`);
    return this.formatUserResponse(user);
  }

  /**
   * Create a staff/driver account (Admin only)
   */
  async createStaff(dto: CreateStaffDto) {
    if (dto.role === 'FACILITY_STAFF' && !dto.facilityId) {
      throw new BadRequestException('facilityId is required for FACILITY_STAFF');
    }

    // Check if mobile already registered
    const existing = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });
    if (existing) {
      throw new ConflictException('Mobile number already registered');
    }

    // Check if email already registered
    const existingEmail = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Validate facilityId only if provided
    if (dto.facilityId) {
      const facility = await this.prisma.facility.findUnique({
        where: { id: dto.facilityId },
      });
      if (!facility || !facility.isActive) {
        throw new NotFoundException(`Facility #${dto.facilityId} not found or inactive`);
      }
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });
    if (!role) throw new NotFoundException(`Role ${dto.role} not found`);

    // Generate role-specific employee ID: F001 for staff, D001 for driver
    const employeeId =
      dto.role === 'DRIVER'
        ? await this.generateDriverId()
        : await this.generateFacilityStaffId();

    // Generate OTP as first-time password
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const passwordHash = await bcrypt.hash(otp, 10);

    // Create user (+ Staff profile for FACILITY_STAFF/DRIVER) in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          mobileNumber: dto.mobileNumber,
          name: dto.name,
          email: dto.email,
          passwordHash,
          mustChangePassword: true,
          roleId: role.id,
        },
        include: { role: true },
      });

      // Create Staff profile for FACILITY_STAFF (and DRIVER for tracking)
      if (dto.role === 'FACILITY_STAFF' || dto.role === 'DRIVER') {
        await tx.staff.create({
          data: {
            userId: user.id,
            employeeId,
            facilityId: dto.facilityId ?? null,
            roleId: role.id,
          },
        });
      }

      return user;
    });

    // Send OTP email to staff/driver
    const roleLabel = dto.role === 'DRIVER' ? 'Driver' : 'Facility Staff';
    try {
      await this.authService.sendEmailOtp(
        dto.email,
        otp,
        `Vastra Express — Your ${roleLabel} Account Login OTP`,
        `Hello ${dto.name},\n\nYour Vastra Express ${roleLabel} account has been created.\n\nUse the following OTP as your first-time login password:\n\n${otp}\n\nLogin with your email (${dto.email}) and this OTP. You will be prompted to set a new password after your first login.\n\nIf you did not expect this email, please ignore it.`,
      );
      this.logger.log(`✅ OTP email sent to ${dto.email} for ${dto.role} account`);
    } catch (err) {
      this.logger.error(`⚠️ Staff account created but OTP email failed for ${dto.email}`, err);
    }

    this.logger.log(`✅ Staff account created: ${dto.role} - ${dto.mobileNumber} [${employeeId}]`);
    return this.formatUserResponse(result);
  }

  /**
   * Update a user's role (Admin only — DRIVER or FACILITY_STAFF only)
   */
  async updateRole(userId: number, roleName: string) {
    const allowedRoles = ['DRIVER', 'FACILITY_STAFF'];
    if (!allowedRoles.includes(roleName)) {
      throw new BadRequestException('Role must be DRIVER or FACILITY_STAFF');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    // If changing TO FACILITY_STAFF, ensure a Staff profile exists
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { roleId: role.id },
        include: { role: true },
      });

      if (roleName === 'FACILITY_STAFF') {
        // Upsert Staff profile
        const existing = await tx.staff.findUnique({ where: { userId } });
        if (!existing) {
          await tx.staff.create({
            data: { userId, facilityId: null, roleId: role.id },
          });
        }
      }

      return u;
    });

    this.logger.log(`✅ Role updated for user ${userId}: ${roleName}`);
    return {
      message: 'Role updated successfully',
      user: this.formatUserResponse(updated),
    };
  }

  /**
   * Toggle user active/inactive status (Admin only)
   */
  async toggleStatus(userId: number, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: { role: true },
    });

    this.logger.log(`✅ User ${userId} status set to ${isActive ? 'active' : 'inactive'}`);
    return {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: this.formatUserResponse(updated),
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  /**
   * Generate next customer ID: C001, C002, ...
   * Counts existing customers with a customerId assigned.
   */
  private async generateCustomerId(): Promise<string> {
    const lastUser = await this.prisma.user.findFirst({
      where: { customerId: { not: null } },
      orderBy: { customerId: 'desc' },
      select: { customerId: true },
    });
    if (!lastUser?.customerId) return 'C001';
    const lastNum = parseInt(lastUser.customerId.replace('C', ''), 10);
    return `C${String(lastNum + 1).padStart(3, '0')}`;
  }

  /**
   * Generate next employee ID: E001, E002, ...
   * Counts existing staff with an employeeId assigned.
   */
  /** F001, F002, ... for FACILITY_STAFF */
  private async generateFacilityStaffId(): Promise<string> {
    const last = await this.prisma.staff.findFirst({
      where: { employeeId: { startsWith: 'F' }, NOT: { employeeId: { startsWith: 'D' } } },
      orderBy: { employeeId: 'desc' },
      select: { employeeId: true },
    });
    if (!last?.employeeId) return 'F001';
    // Handle both old FE/FD format and new F/D format gracefully
    const numPart = last.employeeId.replace(/^[A-Z]+/, '');
    const lastNum = parseInt(numPart, 10);
    return `F${String(lastNum + 1).padStart(3, '0')}`;
  }

  /** D001, D002, ... for DRIVER */
  private async generateDriverId(): Promise<string> {
    const last = await this.prisma.staff.findFirst({
      where: { employeeId: { startsWith: 'D' } },
      orderBy: { employeeId: 'desc' },
      select: { employeeId: true },
    });
    if (!last?.employeeId) return 'D001';
    const numPart = last.employeeId.replace(/^[A-Z]+/, '');
    const lastNum = parseInt(numPart, 10);
    return `D${String(lastNum + 1).padStart(3, '0')}`;
  }

  private formatUserResponse(user: any) {
    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      customerId: user.customerId ?? null,
      name: user.name,
      email: user.email ?? null,
      // Return role as an object so frontend role.name references work correctly
      role: { name: user.role?.name ?? '' },
      isActive: user.isActive,
      // isSetupPending: true means the account exists but password change is pending
      isSetupPending: ['FACILITY_STAFF', 'DRIVER'].includes(user.role?.name)
        ? user.mustChangePassword ?? false
        : undefined,
      createdAt: user.createdAt,
      ...(user.addresses && { addresses: user.addresses }),
      ...(user.staffProfile && { staffProfile: user.staffProfile }),
    };
  }
}
