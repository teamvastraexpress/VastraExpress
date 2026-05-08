import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Matches,
  Length,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum StaffRole {
  DRIVER = 'DRIVER',
  FACILITY_STAFF = 'FACILITY_STAFF',
  ADMIN = 'ADMIN',
}

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian mobile number',
  })
  @Transform(({ value }) => value?.trim())
  mobileNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' '))
  name: string;

  @IsEnum(StaffRole, { message: 'Role must be DRIVER, FACILITY_STAFF, or ADMIN' })
  role: StaffRole;

  @IsInt()
  @IsOptional()
  facilityId?: number; // Required for FACILITY_STAFF, optional for DRIVER/ADMIN

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;
}
