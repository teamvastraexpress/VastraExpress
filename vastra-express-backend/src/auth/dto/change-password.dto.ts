import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Temporary token received from first-time login' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
