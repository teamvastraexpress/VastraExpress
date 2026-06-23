import { IsString, IsOptional, IsEmail, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name?: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian mobile number',
  })
  mobileNumber?: string;
}
