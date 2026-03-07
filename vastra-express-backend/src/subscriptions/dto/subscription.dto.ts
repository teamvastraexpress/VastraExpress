import {
  IsBoolean,
  IsInt,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Monthly Unlimited', description: 'Plan display name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Unlimited wash & fold pickups for 30 days' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 30, description: 'Subscription duration in days (e.g. 30, 90, 365)' })
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiProperty({ example: 999, description: 'Price charged to customer in INR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 1200, description: 'Wallet credit loaded on purchase (INR)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  walletCredit: number;

  @ApiPropertyOptional({ example: { free_pickup: true, discount_percent: 10 }, description: 'JSON object of plan perks' })
  @IsOptional()
  benefits?: Record<string, unknown>;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  walletCredit?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  benefits?: Record<string, unknown>;
}

export class PurchaseSubscriptionDto {
  @ApiProperty({ example: 2, description: 'Subscription plan ID to purchase' })
  @IsInt()
  @Min(1)
  planId: number;

  @ApiPropertyOptional({ example: false, description: 'Enable automatic renewal on expiry' })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class RefundWalletDto {
  @ApiProperty({ example: 5, description: 'Subscription ID to refund wallet credit from' })
  @IsInt()
  @Min(1)
  subscriptionId: number;

  @ApiProperty({ example: 200, description: 'Amount to refund in INR (min ₹0.01)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Customer requested partial refund due to service issue' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
