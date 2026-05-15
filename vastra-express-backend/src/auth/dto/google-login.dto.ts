import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID Token received from frontend',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY3ZTY...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
