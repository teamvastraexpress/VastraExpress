import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssignmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export class AssignDriverDto {
  @ApiProperty({ example: 42, description: 'Order ID to assign a driver to' })
  @IsInt()
  @Min(1)
  orderId: number;

  @ApiProperty({ example: 7, description: 'Driver (user) ID' })
  @IsInt()
  @Min(1)
  driverId: number;

  @ApiProperty({ enum: AssignmentType, example: 'DELIVERY', description: 'PICKUP or DELIVERY' })
  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  @ApiPropertyOptional({ example: 'Call customer before pickup' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssignmentStatusDto {
  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'New status: IN_PROGRESS | ARRIVED | COMPLETED | FAILED',
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 'Unable to locate customer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReassignDriverDto {
  @ApiProperty({ example: 9, description: 'New driver (user) ID' })
  @IsInt()
  @Min(1)
  newDriverId: number;

  @ApiPropertyOptional({ example: 'Previous driver called in sick' })
  @IsOptional()
  @IsString()
  reason?: string;
}
