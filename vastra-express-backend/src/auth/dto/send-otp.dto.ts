import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian mobile number',
  })
  @Transform(({ value }) => value?.trim())
  mobileNumber: string;

  /**
   * If provided, OTP is only sent when the number exists in the DB with this exact role.
   * Used by staff portals (e.g. DRIVER) to block unregistered numbers before OTP is sent.
   * Omit for customer apps where new users are welcome.
   */
  @ApiPropertyOptional({ example: 'DRIVER', description: 'Required role for portal-gated login' })
  @IsString()
  @IsOptional()
  expectedRole?: string;
}
