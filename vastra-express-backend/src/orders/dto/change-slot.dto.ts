import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangePickupSlotDto {
  /**
   * The ID of the new pickup slot to switch to.
   */
  @IsInt()
  @Min(1)
  @Type(() => Number)
  newSlotId: number;
}
