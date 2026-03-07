import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Matches,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsInt()
  @IsOptional()
  cityId?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
