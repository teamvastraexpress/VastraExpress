import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SendNotificationDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  type?: string; // ORDER_UPDATE, PAYMENT, SUBSCRIPTION, PROMO, etc.

  @IsOptional()
  data?: Record<string, string>;
}

export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  targetRole?: string; // CUSTOMER | DRIVER | FACILITY_STAFF | all

  @IsOptional()
  @IsString()
  type?: string;
}
