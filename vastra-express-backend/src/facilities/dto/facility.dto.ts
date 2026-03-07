import { IsString, IsInt, IsOptional, IsBoolean, IsArray, IsNumber, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state: string;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFacilityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsInt()
  cityId: number;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactNumber must be a valid 10-digit Indian mobile number' })
  contactNumber: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  staffUserIds?: number[]; // user IDs of FACILITY_STAFF to assign
}

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactNumber must be a valid 10-digit Indian mobile number' })
  contactNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
