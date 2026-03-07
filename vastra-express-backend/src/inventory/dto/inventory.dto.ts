import {
  IsDecimal,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const INVENTORY_CATEGORIES = [
  'DETERGENT',
  'PACKAGING',
  'TAG',
  'MACHINERY',
  'MISC',
] as const;

export const TRANSACTION_TYPES = ['ADDITION', 'CONSUMPTION', 'ADJUSTMENT'] as const;

export class CreateInventoryItemDto {
  @ApiProperty({ example: 1, description: 'Facility ID this inventory belongs to' })
  @IsInt()
  @Min(1)
  facilityId: number;

  @ApiProperty({ example: 'Ariel Detergent Powder', description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ enum: INVENTORY_CATEGORIES, example: 'DETERGENT', description: 'Inventory category' })
  @IsString()
  @IsIn(INVENTORY_CATEGORIES)
  category: string;

  @ApiProperty({ example: 50, description: 'Opening quantity' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 'kg', description: 'Unit of measurement (kg, pieces, liters, etc.)' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ example: 5, description: 'Quantity below which a low-stock alert fires' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  lowStockThreshold: number;
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  itemName?: string;

  @IsOptional()
  @IsString()
  @IsIn(INVENTORY_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class LogInventoryTransactionDto {
  @ApiProperty({ example: 3, description: 'Inventory item ID to transact against' })
  @IsInt()
  @Min(1)
  inventoryItemId: number;

  @ApiProperty({ enum: TRANSACTION_TYPES, example: 'CONSUMPTION', description: 'Type of stock movement' })
  @IsString()
  @IsIn(TRANSACTION_TYPES)
  transactionType: string;

  @ApiProperty({ example: -2.5, description: 'Quantity change (positive = add stock, negative = consume)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  quantityChange: number;

  @ApiPropertyOptional({ example: 'Used for order batch #101' })
  @IsOptional()
  @IsString()
  notes?: string;
}
