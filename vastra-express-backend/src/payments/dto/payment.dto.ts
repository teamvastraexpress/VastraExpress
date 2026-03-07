import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  RAZORPAY_UPI = 'RAZORPAY_UPI',
  RAZORPAY_CARD = 'RAZORPAY_CARD',
  COD = 'COD',
  WALLET = 'WALLET',
}

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 42, description: 'Vastra Express order ID' })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.RAZORPAY_UPI, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 42, description: 'Vastra Express order ID' })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiProperty({ example: 'order_PYzMHj8k3XkQzl', description: 'Razorpay order ID from create-order response' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_PYzMHj8k3XkQzl', description: 'Razorpay payment ID after successful payment' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ example: 'abc123sig...', description: 'HMAC-SHA256 signature from Razorpay' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}

export class CodPaymentDto {
  @ApiProperty({ example: 42, description: 'Order ID the driver is marking as cash-paid' })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiPropertyOptional({ example: 'Customer paid ₹350 in cash' })
  @IsString()
  @IsOptional()
  notes?: string;
}
