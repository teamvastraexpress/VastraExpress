import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AssignmentType } from '../enums/order-status.enum';

export class AssignOrderDriverDto {
  /**
   * User ID of the driver to assign (must have DRIVER role and be active).
   */
  @IsInt()
  @Min(1)
  driverId: number;

  /**
   * Whether this is a pickup assignment or a delivery assignment.
   */
  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  /**
   * Optional instructions for the driver.
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
