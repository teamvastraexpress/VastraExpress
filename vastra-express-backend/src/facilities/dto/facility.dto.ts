import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';
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

  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactNumber must be a valid 10-digit Indian mobile number' })
  contactNumber: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  staffUserIds?: number[]; // user IDs of FACILITY_STAFF or DRIVER to assign
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
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactNumber must be a valid 10-digit Indian mobile number' })
  contactNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  staffUserIds?: number[]; // user IDs of FACILITY_STAFF or DRIVER to assign
}
