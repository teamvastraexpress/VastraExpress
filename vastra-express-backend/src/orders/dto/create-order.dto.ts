import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '../enums/order-status.enum';

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: "ID of the customer's saved address for pickup" })
  @IsInt()
  @Min(1)
  addressId: number;

  @ApiProperty({ example: 5, description: 'ID of an available pickup slot' })
  @IsInt()
  @Min(1)
  pickupSlotId: number;

  @ApiPropertyOptional({
    enum: ServiceType,
    example: ServiceType.WASH_FOLD,
    description: 'Type of laundry service (use SOFA_CLEANING for special requests)',
  })
  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @ApiPropertyOptional({ example: false, description: 'Express processing (adds express charge; not applicable to sofa cleaning)' })
  @IsBoolean()
  @IsOptional()
  isExpress?: boolean;

  @ApiPropertyOptional({ example: 3, description: "Customer's active subscription ID" })
  @IsInt()
  @IsOptional()
  @Min(1)
  subscriptionId?: number;

  @ApiPropertyOptional({ example: 'Please handle with care', description: 'Special instructions' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  customerNotes?: string;
}
