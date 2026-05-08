import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

interface OtpData {
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

interface AuthResultUser {
  id: number;
  email: string | null;
  mobileNumber: string;
  name: string;
  role: string;
  isActive: boolean;
  staffProfile?: any;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, OtpData>();
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.cleanupInterval = setInterval(() => this.cleanupExpiredOtps(), 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('OTP cleanup interval cleared');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeMobileNumber(mobileNumber: string): string {
    return mobileNumber.replace(/\D/g, '');
  }

  private generateOtp(): string {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  }

  private verifyOtpConstantTime(userOtp: string, storedOtp: string): boolean {
    if (userOtp.length !== storedOtp.length) {
      return false;
    }

    const userBuffer = Buffer.from(userOtp, 'utf8');
    const storedBuffer = Buffer.from(storedOtp, 'utf8');

    try {
      return crypto.timingSafeEqual(userBuffer, storedBuffer);
    } catch {
      return false;
    }
  }

  private isOtpDebugEnabled(): boolean {
    const explicit = this.configService.get<string>('EXPOSE_OTP_IN_RESPONSE');
    if (explicit !== undefined && explicit !== null && explicit !== '') {
      return explicit === 'true';
    }

    return this.configService.get('NODE_ENV') === 'development';
  }

  async sendEmailOtp(email: string, otp: string, subject?: string, body?: string): Promise<void> {
    const sendUrl =
      this.configService.get<string>('EMAIL_OTP_SEND_URL') ??
      'https://email.indiegrampublications.com/send_email.php';
    const authToken = this.configService.get<string>('EMAIL_OTP_AUTH_TOKEN') ?? 'MY_SECRET_KEY_123';

    const emailSubject = subject ?? 'Vastra Express registration OTP';
    const emailBody = body ??
      `Your Vastra Express registration OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;

    const formData = new FormData();
    formData.append('to', email);
    formData.append('subject', emailSubject);
    formData.append('body', emailBody);
    formData.append('token', authToken);

    const response = await fetch(sendUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: authToken,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      this.logger.error(`❌ Failed to send OTP email to ${email}: ${response.status} ${responseText}`);
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }

    this.logger.log(`✅ OTP email sent successfully to ${email}`);
  }

  private async toResponseUser(user: any): Promise<AuthResultUser> {
    return {
      id: user.id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      name: user.name,
      role: user.role?.name ?? 'CUSTOMER',
      isActive: user.isActive,
      staffProfile: user.staffProfile ?? null,
    };
  }

  private async createAccessToken(user: AuthResultUser): Promise<string> {
    const payload: Record<string, unknown> = {
      sub: user.id,
      email: user.email,
      mobile: user.mobileNumber,
      role: user.role,
    };

    if (user.staffProfile?.facilityId !== undefined && user.staffProfile?.facilityId !== null) {
      payload.facilityId = user.staffProfile.facilityId;
    }

    return this.jwtService.sign(payload);
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{
    message: string;
    expiresIn: number;
    isNewUser: boolean;
    debugOtp?: string;
  }> {
    const email = this.normalizeEmail(sendOtpDto.email);

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existingOtp = this.otpStore.get(email);
    if (existingOtp) {
      const timeSinceCreation = Date.now() - existingOtp.createdAt.getTime();
      const cooldownPeriod = 60000;

      if (timeSinceCreation < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceCreation) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        );
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered. Please log in instead.');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);

    this.otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });

    await this.sendEmailOtp(email, otp);

    const debugOtp = this.isOtpDebugEnabled() ? otp : undefined;

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
      isNewUser: true,
      ...(debugOtp ? { debugOtp } : {}),
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    accessToken: string;
    isNewUser: boolean;
    user: any;
  }> {
    const email = this.normalizeEmail(verifyOtpDto.email);
    const mobileNumber = this.normalizeMobileNumber(verifyOtpDto.mobileNumber);
    const roleName = verifyOtpDto.role.trim().toUpperCase();

    const otpData = this.otpStore.get(email);
    if (!otpData) {
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    if (otpData.attempts >= this.MAX_OTP_ATTEMPTS) {
      this.otpStore.delete(email);
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    if (!this.verifyOtpConstantTime(verifyOtpDto.otp, otpData.otp)) {
      otpData.attempts += 1;
      this.otpStore.set(email, otpData);
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    this.otpStore.delete(email);

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      throw new BadRequestException('Mobile number must be a valid 10-digit Indian mobile number');
    }

    if (!['CUSTOMER', 'DRIVER', 'FACILITY_STAFF'].includes(roleName)) {
      throw new BadRequestException('Role must be CUSTOMER, DRIVER, or FACILITY_STAFF');
    }

    const name = verifyOtpDto.name.trim();
    const password = verifyOtpDto.password;

    const existingEmailUser = await this.prisma.user.findFirst({
      where: { email },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });
    if (existingEmailUser) {
      throw new BadRequestException('Email is already registered. Please log in instead.');
    }

    const existingMobileUser = await this.prisma.user.findFirst({
      where: { mobileNumber },
      include: { role: true },
    });
    if (existingMobileUser) {
      throw new BadRequestException('Mobile number is already registered. Please log in instead.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const roleRecord = await tx.role.findUnique({ where: { name: roleName } });
      if (!roleRecord) {
        throw new InternalServerErrorException(`${roleName} role not found in database`);
      }

      let customerId: string | null = null;
      if (roleName === 'CUSTOMER') {
        const lastCustomer = await tx.user.findFirst({
          where: { customerId: { not: null } },
          orderBy: { customerId: 'desc' },
          select: { customerId: true },
        });
        const nextCustomerNum = lastCustomer?.customerId
          ? parseInt(lastCustomer.customerId.replace('C', ''), 10) + 1
          : 1;
        customerId = `C${String(nextCustomerNum).padStart(3, '0')}`;
      }

      const created = await tx.user.create({
        data: {
          email,
          mobileNumber,
          name,
          customerId,
          passwordHash,
          roleId: roleRecord.id,
          fcmToken: verifyOtpDto.fcmToken || null,
          isActive: true,
        },
        include: { role: true },
      });

      if (roleName === 'FACILITY_STAFF') {
        const facilityId = verifyOtpDto.facilityId ?? null;
        if (facilityId !== null) {
          const facility = await tx.facility.findUnique({ where: { id: facilityId } });
          if (!facility) {
            throw new BadRequestException('Selected facility does not exist');
          }
        }

        await tx.staff.create({
          data: {
            userId: created.id,
            roleId: roleRecord.id,
            facilityId,
          },
        });
      }

      return created;
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });

    if (!fullUser) {
      throw new InternalServerErrorException('Failed to load created user');
    }

    this.logger.log(`✅ New ${roleName.toLowerCase()} registered via email: ${email}`);

    const responseUser = await this.toResponseUser(fullUser);
    const accessToken = await this.createAccessToken(responseUser);

    return {
      accessToken,
      isNewUser: true,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        mobileNumber: fullUser.mobileNumber,
        name: fullUser.name,
        role: fullUser.role.name,
        isActive: fullUser.isActive,
        staffProfile: fullUser.staffProfile ?? null,
      },
    };
  }

  async login(email: string, password: string): Promise<{ accessToken?: string; mustChangePassword?: boolean; tempToken?: string; user: any }> {
    const normalizedEmail = this.normalizeEmail(email);

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role.name === 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin accounts must use admin login.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Contact your administrator.');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // First-time login for admin-created staff/driver — require password change
    if (user.mustChangePassword) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, purpose: 'password-change' },
        { expiresIn: '15m' },
      );
      this.logger.log(`🔑 First-time login for ${normalizedEmail} — password change required`);
      return {
        mustChangePassword: true,
        tempToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
        },
      };
    }

    const responseUser = await this.toResponseUser(user);
    const accessToken = await this.createAccessToken(responseUser);

    this.logger.log(`✅ User logged in via email: ${normalizedEmail}`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        name: user.name,
        role: user.role.name,
        isActive: user.isActive,
        staffProfile: user.staffProfile ?? null,
      },
    };
  }

  async changePassword(tempToken: string, newPassword: string): Promise<{ accessToken: string; user: any }> {
    // 1. Verify temp token
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired token. Please log in again.');
    }

    if (payload.purpose !== 'password-change') {
      throw new UnauthorizedException('Invalid token type.');
    }

    const userId = payload.sub;

    // 2. Find user and verify mustChangePassword is still true
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.mustChangePassword) {
      throw new BadRequestException('Password has already been changed. Please log in normally.');
    }

    // 3. Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    this.logger.log(`✅ Password changed for user ${userId} (${user.email})`);

    // 4. Return full session token
    const responseUser = await this.toResponseUser(user);
    const accessToken = await this.createAccessToken(responseUser);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        name: user.name,
        role: user.role.name,
        isActive: user.isActive,
        staffProfile: user.staffProfile ?? null,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        staffProfile: { include: { facility: true } },
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      mobileNumber: user.mobileNumber,
      name: user.name,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      defaultAddress: user.addresses[0] || null,
      staffProfile: user.staffProfile ?? null,
    };
  }

  async adminLogin(username: string, password: string): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: { username },
      include: { role: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.role.name !== 'ADMIN') {
      throw new UnauthorizedException('Access denied. Admin accounts only.');
    }

    const payload = { sub: user.id, role: user.role.name, mobile: user.mobileNumber };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`✅ Admin logged in: ${username}`);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async seedAdminAccount() {
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) return;

    const defaultUsername = this.configService.get<string>('ADMIN_USERNAME') ?? 'admin';
    const defaultPassword = this.configService.get<string>('ADMIN_PASSWORD') ?? 'password';

    const existing = await this.prisma.user.findFirst({ where: { username: defaultUsername } });
    if (existing) {
      this.logger.log(`✅ Admin account already exists: ${defaultUsername}`);
      return;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.create({
      data: {
        mobileNumber: '0000000000',
        name: 'Admin',
        username: defaultUsername,
        passwordHash,
        roleId: adminRole.id,
        isActive: true,
      },
    });

    this.logger.log(`✅ Default admin account created — username: "${defaultUsername}"`);
    if (defaultPassword === 'password') {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        throw new Error(
          'FATAL: Admin is using default password in production. ' +
          'Set ADMIN_PASSWORD in environment variables before deploying.',
        );
      }
      this.logger.warn('⚠️  Admin is using default password. Set ADMIN_PASSWORD in .env before production!');
    }
  }

  private async ensureRoleExists(roleName: string) {
    let role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: roleName,
          permissions: {},
        },
      });
      this.logger.log(`✅ Role created: ${roleName}`);
    }

    return role;
  }

  async seedRoles() {
    const roles = ['CUSTOMER', 'DRIVER', 'FACILITY_STAFF', 'ADMIN'];

    for (const roleName of roles) {
      await this.ensureRoleExists(roleName);
    }

    this.logger.log('✅ All roles ensured in database');
  }

  private cleanupExpiredOtps() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
    }
  }
}
