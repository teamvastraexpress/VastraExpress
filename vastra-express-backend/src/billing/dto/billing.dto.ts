import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceTypeBilling {
  WASH_FOLD = 'WASH_FOLD',
  DRY_CLEAN = 'DRY_CLEAN',
  IRON_ONLY = 'IRON_ONLY',
}

export class GenerateBillDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Use item-based billing instead of weight-based. Items must be added first via POST /orders/:id/items.',
  })
  @IsOptional()
  useItemBilling?: boolean;
}

export class UpdatePricingDto {
  @ApiProperty({ enum: ServiceTypeBilling, example: ServiceTypeBilling.WASH_FOLD })
  @IsEnum(ServiceTypeBilling)
  serviceType: ServiceTypeBilling;

  @ApiPropertyOptional({ example: 1, description: 'City ID. Omit for global pricing.' })
  @IsInt()
  @IsOptional()
  @Min(1)
  cityId?: number;

  @ApiPropertyOptional({ example: 80, description: 'Price per kg in INR (weight-based billing).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  pricePerKg?: number;

  @ApiPropertyOptional({ example: 'Silk Saree', description: 'Item name for per-item pricing.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  itemName?: string;

  @ApiPropertyOptional({ example: 150, description: 'Price per individual item in INR.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  pricePerItem?: number;

  /**
   * Minimum billable order value (INR). Defaults to ₹500.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: 50, description: 'Extra charge for express processing (INR).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  expressDeliveryCharge?: number;

  @ApiPropertyOptional({ example: 40, description: 'Pickup & delivery charge for non-subscribers (INR).' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  pickupDeliveryChargeNonSubscriber?: number;
}
