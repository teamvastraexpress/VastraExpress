import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSlotDto {
  @IsDateString({}, { message: 'slotDate must be a valid date (YYYY-MM-DD)' })
  @IsOptional()
  slotDate?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format (24hr)',
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format (24hr)',
  })
  endTime?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxCapacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
