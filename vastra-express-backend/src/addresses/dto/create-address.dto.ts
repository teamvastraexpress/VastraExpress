import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Matches,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Flat 4B', description: 'House / flat number' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  houseFlatNo: string;

  @ApiProperty({ example: '12 MG Road, Andheri West', description: 'Full street address' })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  @Transform(({ value }) => value?.trim())
  street: string;

  @ApiPropertyOptional({ example: 'Near Reliance Fresh', description: 'Nearby landmark' })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  @Transform(({ value }) => value?.trim())
  landmark?: string;

  @ApiProperty({ example: '400053', description: '6-digit Indian pincode' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode: string;

  @ApiProperty({ example: 19.076, description: 'GPS latitude of the address' })
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 72.8777, description: 'GPS longitude of the address' })
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @ApiProperty({ example: 1, description: 'City ID from the cities table' })
  @IsInt()
  @IsNotEmpty()
  cityId: number;

  @ApiPropertyOptional({ example: true, description: 'Set as default delivery address' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
