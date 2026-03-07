import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateWeightDto {
  /**
   * Weight measured at the time of pickup (kg).
   * Updated by the driver after collecting the laundry.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.1)
  @Max(500)
  initialWeight?: number;

  /**
   * Actual weight after sorting at the facility (kg).
   * Used for weight-based billing. Updated by facility staff.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.1)
  @Max(500)
  finalWeight?: number;
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
