import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered email address' })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @Transform(({ value }) => value?.trim())
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}