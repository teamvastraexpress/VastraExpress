import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { StaffCheckDto } from './dto/staff-check.dto';
import { StaffSetupDto } from './dto/staff-setup.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Admin login via username + password (web dashboard only)
   * Rate limited: 10 requests per minute per IP
   */
  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async adminLogin(@Body() body: AdminLoginDto) {
    return this.authService.adminLogin(body.username, body.password);
  }

  /**
   * Send OTP to mobile number (customers & drivers)
   * Rate limited: 5 requests per minute per IP
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  /**
   * Verify OTP and login/register (customers & drivers)
   * Rate limited: 10 requests per minute per IP
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // ─── Facility Staff Auth ──────────────────────────────────────────────────

  /**
   * Step 1 — Check if mobile belongs to a FACILITY_STAFF account.
   * Auto-sends OTP when isFirstLogin = true so staff can verify identity + set password.
   * Rate limited: 10 requests per minute per IP
   */
  @Post('staff-check')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Facility staff: check mobile and determine login type' })
  async staffCheck(@Body() body: StaffCheckDto) {
    return this.authService.staffCheck(body.mobileNumber);
  }

  /**
   * Step 2a — First-time facility staff login.
   * Verifies OTP sent during staff-check, sets a permanent password, returns JWT.
   * Rate limited: 5 requests per minute per IP
   */
  @Post('staff-setup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Facility staff: first-time OTP verify + password setup' })
  async staffSetup(@Body() body: StaffSetupDto) {
    return this.authService.staffSetup(body.mobileNumber, body.otp, body.password);
  }

  /**
   * Step 2b — Returning facility staff login.
   * Validates mobile + password, returns JWT.
   * Rate limited: 10 requests per minute per IP
   */
  @Post('staff-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Facility staff: mobile + password login' })
  async staffLogin(@Body() body: StaffLoginDto) {
    return this.authService.staffLogin(body.mobileNumber, body.password);
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get current user profile
   * Protected route - requires JWT token
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async getProfile(@CurrentUser('userId') userId: number) {
    return this.authService.getProfile(userId);
  }

  /**
   * Logout (placeholder for future token blacklist)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('userId') userId: number) {
    // TODO: Implement token blacklist with Redis in future
    return {
      message: 'Logged out successfully',
      userId,
    };
  }
}

