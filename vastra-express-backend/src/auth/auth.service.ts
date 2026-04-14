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
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

interface OtpData {
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, OtpData>();
  private readonly MAX_OTP_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly OTP_LENGTH = 6;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Clean up expired OTPs every minute
    this.cleanupInterval = setInterval(() => this.cleanupExpiredOtps(), 60000);
  }

  onModuleDestroy() {
    // CRITICAL: Clear interval to prevent memory leak
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('OTP cleanup interval cleared');
    }
  }

  /**
   * Generate a secure 6-digit OTP
   */
  private generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Constant-time OTP comparison to prevent timing attacks
   * SECURITY: Mitigates side-channel attacks via response time analysis
   */
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

  /**
   * Temporary beta flag: expose OTP in API responses for web notifications.
   * Keep disabled in normal production operation.
   */
  private isOtpExposeEnabled(): boolean {
    const explicit = this.configService.get<string>('EXPOSE_OTP_IN_RESPONSE');
    if (explicit !== undefined && explicit !== null && explicit !== '') {
      return explicit === 'true';
    }

    // Temporary safety fallback for beta: if MSG91 is not configured,
    // expose OTP in response so web clients can display it.
    const msg91AuthKey = this.configService.get<string>('MSG91_AUTH_KEY');
    const msg91TemplateId = this.configService.get<string>('MSG91_TEMPLATE_ID');
    return !msg91AuthKey || !msg91TemplateId;
  }

  /**
   * Send OTP via MSG91 SMS
   */
  private async sendSms(mobileNumber: string, otp: string): Promise<void> {
    const msg91AuthKey = this.configService.get<string>('MSG91_AUTH_KEY');
    const msg91TemplateId = this.configService.get<string>('MSG91_TEMPLATE_ID');
    const exposeOtpInResponse = this.isOtpExposeEnabled();

    // If MSG91 credentials not configured, log OTP (DEV ONLY)
    if (!msg91AuthKey || !msg91TemplateId) {
      if (exposeOtpInResponse) {
        this.logger.warn(
          'MSG91 not configured. Continuing because EXPOSE_OTP_IN_RESPONSE=true (temporary mode).',
        );
        return;
      }

      const isDevelopment = this.configService.get('NODE_ENV') === 'development';
      
      if (isDevelopment) {
        this.logger.warn(`⚠️ MSG91 not configured. OTP for ${mobileNumber}: ${otp}`);
        this.logger.warn('⚠️ This should NEVER happen in production!');
      } else {
        // PRODUCTION: Never log OTPs
        this.logger.error('MSG91 credentials not configured');
        throw new InternalServerErrorException('SMS service unavailable');
      }
      return;
    }

    try {
      // MSG91 API call — authkey must be a request header, NOT in the body
      const response = await axios.post(
        `https://control.msg91.com/api/v5/otp`,
        {
          template_id: msg91TemplateId,
          mobile: `91${mobileNumber}`, // Add country code
          otp: otp,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authkey: msg91AuthKey,
          },
        },
      );

      if (response.data.type !== 'success') {
        throw new Error('SMS sending failed');
      }

      this.logger.log(`✅ OTP sent successfully to ${mobileNumber}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP to ${mobileNumber}:`, error.message);

      if (this.isOtpExposeEnabled()) {
        this.logger.warn(
          'SMS send failed but continuing because EXPOSE_OTP_IN_RESPONSE=true (temporary mode).',
        );
        return;
      }

      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Send OTP to mobile number
   */
  async sendOtp(sendOtpDto: SendOtpDto): Promise<{
    message: string;
    expiresIn: number;
    isNewUser: boolean;
    debugOtp?: string;
  }> {
    const { mobileNumber, expectedRole } = sendOtpDto;

    // Check if OTP was sent recently (prevent spam)
    const existingOtp = this.otpStore.get(mobileNumber);
    if (existingOtp) {
      const timeSinceCreation = Date.now() - existingOtp.createdAt.getTime();
      const cooldownPeriod = 60000; // 1 minute

      if (timeSinceCreation < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceCreation) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        );
      }
    }

    // Check if user already exists (to tell frontend whether to show name field)
    const existingUser = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: { role: true },
    });
    const isNewUser = !existingUser;

    // Portal-gated login: if caller specifies an expectedRole (e.g. DRIVER portal),
    // block the OTP entirely if the number is not pre-registered with that exact role.
    // This prevents the OTP from being sent at all — the error is shown on the
    // phone-number step, not after OTP entry.
    if (expectedRole) {
      if (!existingUser) {
        throw new BadRequestException(
          'This number is not registered. Please contact your administrator.',
        );
      }
      if (existingUser.role.name !== expectedRole) {
        throw new BadRequestException(
          'This number is not registered. Please contact your administrator.',
        );
      }
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);

    // Store OTP with metadata
    this.otpStore.set(mobileNumber, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });

    // Send OTP via SMS
    await this.sendSms(mobileNumber, otp);

    const debugOtp = this.isOtpExposeEnabled() ? otp : undefined;

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60, // seconds
      isNewUser,
      ...(debugOtp ? { debugOtp } : {}),
    };
  }

  /**
   * Verify OTP and login/register user
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    accessToken: string;
    isNewUser: boolean;
    user: any;
  }> {
    const { mobileNumber, otp, name, fcmToken } = verifyOtpDto;

    // Get stored OTP data
    const otpData = this.otpStore.get(mobileNumber);

    if (!otpData) {
      // SECURITY: Generic error to prevent user enumeration
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    // Check expiry
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    // Check max attempts (anti-bruteforce)
    if (otpData.attempts >= this.MAX_OTP_ATTEMPTS) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    // Verify OTP with constant-time comparison
    if (!this.verifyOtpConstantTime(otp, otpData.otp)) {
      otpData.attempts++;
      this.otpStore.set(mobileNumber, otpData);

      // SECURITY: Don't reveal remaining attempts count
      throw new UnauthorizedException('Invalid OTP or OTP expired');
    }

    // OTP verified successfully - delete immediately (prevent replay)
    this.otpStore.delete(mobileNumber);

    // Find or create user (with transaction for data consistency)
    let user = await this.prisma.user.findUnique({
      where: { mobileNumber },
      include: { role: true },
    });

    let isNewlyCreated = false;

    if (!user) {
      // New user — create with provided name or placeholder (register screen will update it)
      const userName = name?.trim() && name.trim().length >= 2 ? name.trim() : 'New Customer';

      // New user - auto-register as CUSTOMER in transaction.
      // customerId generation is INSIDE the transaction to prevent race conditions
      // where two concurrent registrations could derive the same customerId.
      user = await this.prisma.$transaction(async (tx) => {
        const lastCustomer = await tx.user.findFirst({
          where: { customerId: { not: null } },
          orderBy: { customerId: 'desc' },
          select: { customerId: true },
        });
        const nextCustomerNum = lastCustomer?.customerId
          ? parseInt(lastCustomer.customerId.replace('C', ''), 10) + 1
          : 1;
        const customerId = `C${String(nextCustomerNum).padStart(3, '0')}`;

        const customerRole = await tx.role.findUnique({
          where: { name: 'CUSTOMER' },
        });

        if (!customerRole) {
          throw new InternalServerErrorException('Customer role not found in database');
        }

        return await tx.user.create({
          data: {
            mobileNumber,
            name: userName,
            customerId,
            roleId: customerRole.id,
            fcmToken: fcmToken || null,
            isActive: true,
          },
          include: { role: true },
        });
      });

      isNewlyCreated = true;
      this.logger.log(`✅ New customer registered: ${mobileNumber} [${user.customerId}]`);;
    } else {
      // Existing user - update FCM token if provided
      if (fcmToken && user.fcmToken !== fcmToken) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { fcmToken },
          include: { role: true },
        });
      }

      this.logger.log(`✅ User logged in: ${mobileNumber}`);
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      mobile: user.mobileNumber,
      role: user.role.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      isNewUser: isNewlyCreated,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        role: user.role.name,
      },
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
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
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FACILITY STAFF AUTHENTICATION (Password + OTP hybrid)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Internal helper — sends OTP to a mobile number, respecting the 1-min cooldown
   * silently (does NOT throw on cooldown — caller can still proceed to setup screen
   * because the OTP from the previous request is still valid).
   */
  private async sendOtpForStaffSetup(mobileNumber: string): Promise<string | undefined> {
    const existing = this.otpStore.get(mobileNumber);
    if (existing) {
      const elapsed = Date.now() - existing.createdAt.getTime();
      if (elapsed < 60000) {
        // OTP already sent recently — still valid, no need to resend
        return this.isOtpExposeEnabled() ? existing.otp : undefined;
      }
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60000);
    this.otpStore.set(mobileNumber, { otp, expiresAt, attempts: 0, createdAt: new Date() });
    await this.sendSms(mobileNumber, otp);

    return this.isOtpExposeEnabled() ? otp : undefined;
  }

  /**
   * Step 1 of facility staff login.
   * Checks whether the mobile is a registered FACILITY_STAFF account.
   * If first login (no password set), auto-sends OTP for identity verification.
   * Returns { exists, isFirstLogin, name } — generic response prevents user enumeration.
   */
  async staffCheck(mobileNumber: string): Promise<{
    exists: boolean;
    isFirstLogin?: boolean;
    name?: string;
    debugOtp?: string;
  }> {
    const user = await this.prisma.user.findFirst({
      where: { mobileNumber, role: { name: 'FACILITY_STAFF' } },
      include: { role: true },
    });

    if (!user) {
      // SECURITY: Return same shape for non-existent / wrong-role accounts
      return { exists: false };
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Contact your administrator.');
    }

    const isFirstLogin = !user.passwordHash;
    let debugOtp: string | undefined;

    if (isFirstLogin) {
      // Auto-send OTP so staff can verify their identity and set a password
      debugOtp = await this.sendOtpForStaffSetup(mobileNumber);
      this.logger.log(`📱 OTP sent for first-time staff setup: ${mobileNumber}`);
    }

    return {
      exists: true,
      isFirstLogin,
      name: user.name,
      ...(debugOtp ? { debugOtp } : {}),
    };
  }

  /**
   * Step 2a — First-time staff login.
   * Verifies OTP and sets a permanent password. Returns JWT on success.
   */
  async staffSetup(
    mobileNumber: string,
    otp: string,
    password: string,
  ): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: { mobileNumber, role: { name: 'FACILITY_STAFF' } },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or inactive');
    }

    if (user.passwordHash) {
      throw new BadRequestException(
        'Account is already set up. Please use the sign-in form instead.',
      );
    }

    // ── Verify OTP ──────────────────────────────────────────────────────────
    const otpData = this.otpStore.get(mobileNumber);

    if (!otpData) {
      throw new UnauthorizedException('OTP expired or not requested. Go back and try again.');
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException('OTP expired. Go back and request a new one.');
    }

    if (otpData.attempts >= this.MAX_OTP_ATTEMPTS) {
      this.otpStore.delete(mobileNumber);
      throw new UnauthorizedException('Too many incorrect attempts. Go back and request a new OTP.');
    }

    if (!this.verifyOtpConstantTime(otp, otpData.otp)) {
      otpData.attempts++;
      this.otpStore.set(mobileNumber, otpData);
      throw new UnauthorizedException('Invalid OTP.');
    }

    this.otpStore.delete(mobileNumber);

    // ── Set password ────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });

    const payload = { sub: updated.id, mobile: updated.mobileNumber, role: updated.role.name, facilityId: updated.staffProfile?.facilityId ?? null };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`✅ Facility staff account set up: ${mobileNumber}`);

    return {
      accessToken,
      user: {
        id: updated.id,
        mobileNumber: updated.mobileNumber,
        name: updated.name,
        role: updated.role.name,
        staffProfile: updated.staffProfile ?? null,
      },
    };
  }

  /**
   * Step 2b — Returning facility staff login.
   * Validates mobile + password and returns JWT.
   */
  async staffLogin(
    mobileNumber: string,
    password: string,
  ): Promise<{ accessToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: { mobileNumber, role: { name: 'FACILITY_STAFF' } },
      include: { role: true, staffProfile: { include: { facility: true } } },
    });

    // SECURITY: Same error for "not found" and "wrong password"
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Contact your administrator.');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    const payload = { sub: user.id, mobile: user.mobileNumber, role: user.role.name, facilityId: user.staffProfile?.facilityId ?? null };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`✅ Facility staff logged in: ${mobileNumber}`);

    return {
      accessToken,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        role: user.role.name,
        staffProfile: user.staffProfile ?? null,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Admin login via username + password (web dashboard only)
   */
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

  /**
   * Seed default admin account (called on module init)
   * Username: admin, Password: password (change in production via env)
   */
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

  /**
   * Ensure role exists in database (seed on first use)
   */
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

  /**
   * Seed initial roles (called on module init)
   */
  async seedRoles() {
    const roles = ['CUSTOMER', 'DRIVER', 'FACILITY_STAFF', 'ADMIN'];

    for (const roleName of roles) {
      await this.ensureRoleExists(roleName);
    }

    this.logger.log('✅ All roles ensured in database');
  }

  /**
   * Cleanup expired OTPs from memory
   */
  private cleanupExpiredOtps() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [mobile, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(mobile);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`🧹 Cleaned up ${cleanedCount} expired OTPs`);
    }
  }
}
