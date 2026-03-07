import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSlotDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  facilityId: number;

  @IsDateString({}, { message: 'slotDate must be a valid date (YYYY-MM-DD)' })
  @IsNotEmpty()
  slotDate: string; // "2026-02-25"

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format (24hr)',
  })
  startTime: string; // "09:00"

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format (24hr)',
  })
  endTime: string; // "11:00"

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxCapacity?: number; // default 10

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
