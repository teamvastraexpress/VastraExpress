import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address used for registration OTP' })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, {
    message: 'Email must be a valid email address',
  })
  @Transform(({ value }) => value?.trim())
  email: string;

  /**
   * Optional registration role hint for the client flow.
   * OTP is only used during registration, not login.
   */
  @ApiPropertyOptional({ example: 'DRIVER', description: 'Registration role hint' })
  @IsString()
  @IsOptional()
  expectedRole?: string;
}
