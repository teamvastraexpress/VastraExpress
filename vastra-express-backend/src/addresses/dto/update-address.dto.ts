import {
  IsString,
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

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  houseFlatNo?: string;

  @IsString()
  @IsOptional()
  @Length(5, 255)
  @Transform(({ value }) => value?.trim())
  street?: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  @Transform(({ value }) => value?.trim())
  landmark?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' })
  pincode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @IsInt()
  @IsOptional()
  cityId?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
