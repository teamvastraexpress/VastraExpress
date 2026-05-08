import { IsEmail, IsString, IsNotEmpty, IsOptional, Matches, Length, MinLength, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address used for registration OTP' })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, {
    message: 'Email must be a valid email address',
  })
  @Transform(({ value }) => value?.trim())
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP received by email' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;

  @ApiProperty({ example: 'Rahul Sharma', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name: string;

  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian mobile number',
  })
  @Transform(({ value }) => value?.trim())
  mobileNumber: string;

  @ApiProperty({ example: 'CUSTOMER', description: 'Account type being registered' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(CUSTOMER|DRIVER|FACILITY_STAFF)$/i, {
    message: 'Role must be CUSTOMER, DRIVER, or FACILITY_STAFF',
  })
  role: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password for login' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({ example: 12, description: 'Facility ID for facility staff registration' })
  @IsOptional()
  @IsInt()
  facilityId?: number;

}
