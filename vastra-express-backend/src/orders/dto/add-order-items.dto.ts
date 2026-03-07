import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '../enums/order-status.enum';

export class OrderItemDto {
  /**
   * Descriptive item name, e.g. "Shirt", "Silk Saree", "Denim Jacket"
   */
  @IsString()
  @MaxLength(100)
  itemName: string;

  /**
   * Number of this item in the order.
   */
  @IsInt()
  @Min(1)
  quantity: number;

  /**
   * Service applied to this specific item (may differ from order-level service type).
   */
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  /**
   * Price per single item in INR (no GST).
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerItem: number;
}

export class AddOrderItemsDto {
  /**
   * List of items identified at the facility.
   * totalPrice for each item is auto-calculated as quantity × pricePerItem.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
