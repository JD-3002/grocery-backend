import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsArray,
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
  summary: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  categoryIds: string[]; // Now accepts array of category IDs
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
  summary?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[]; // Optional array of category IDs for updates
}
