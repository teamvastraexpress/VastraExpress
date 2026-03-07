import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAvailableSlotsDto {
  /** Date to fetch slots for (YYYY-MM-DD). Defaults to today (IST) if omitted. */
  @IsDateString({}, { message: 'date must be a valid date (YYYY-MM-DD)' })
  @IsOptional()
  date?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  facilityId?: number;
}
