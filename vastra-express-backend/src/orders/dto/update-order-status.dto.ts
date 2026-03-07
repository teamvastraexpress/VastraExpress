import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  /**
   * Target status to transition the order to.
   * The state machine enforces valid transitions and role permissions.
   */
  @IsEnum(OrderStatus)
  status: OrderStatus;

  /**
   * Optional notes to attach to this status change
   * (e.g. reason for cancellation, issue description).
   */
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
