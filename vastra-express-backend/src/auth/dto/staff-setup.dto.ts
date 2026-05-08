import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches, ValidateIf } from 'class-validator';

export class StaffSetupDto {
  @ApiProperty({ example: '9876543210', description: '10-digit mobile number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobileNumber: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP sent to mobile (legacy flow). Required when firebaseIdToken is not provided.',
    required: false,
  })
  @ValidateIf((o) => !o.firebaseIdToken)
  @IsString()
  @IsNotEmpty()
  otp?: string;

  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'Firebase ID token from phone verification. Required when otp is not provided.',
    required: false,
  })
  @ValidateIf((o) => !o.otp)
  @IsString()
  @IsNotEmpty()
  firebaseIdToken?: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
