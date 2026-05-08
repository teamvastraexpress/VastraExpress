import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class FirebaseSessionDto {
  @ApiProperty({
    description: 'Firebase Auth ID token returned after phone verification on client',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({
    example: 'DRIVER',
    description: 'Optional role gate for portal logins (e.g. DRIVER).',
  })
  @IsString()
  @IsOptional()
  expectedRole?: string;

  @ApiPropertyOptional({
    example: 'Rahul Sharma',
    description: 'Optional display name, used when creating a new customer account.',
  })
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
