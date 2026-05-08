import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFacilityOptionsDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  addressId: number;

  @IsDateString({}, { message: 'pickupDate must be a valid date (YYYY-MM-DD)' })
  pickupDate: string;
}
