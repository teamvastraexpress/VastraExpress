import { IsString, IsNotEmpty, IsOptional, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian mobile number',
  })
  @Transform(({ value }) => value?.trim())
  mobileNumber: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP received via SMS' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Full name (required only on first registration)' })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name?: string;

  @ApiPropertyOptional({ description: 'Firebase device token for push notifications' })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
