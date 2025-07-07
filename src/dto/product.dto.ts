import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsBoolean,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  title: string;

  @IsUrl()
  image: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  discountedPrice?: number;

  @IsString()
  category: string;

  @IsString()
  summary: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  discountedPrice?: number | null;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
