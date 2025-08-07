import { IsString, IsOptional, IsBoolean, IsArray } from "class-validator";

export class CreateProductDto {
  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  price: string;

  @IsString()
  @IsOptional()
  boxPrice?: string | null;

  @IsString()
  @IsOptional()
  boxDiscountPrice?: string | null;

  @IsString()
  summary: string;

  @IsString()
  @IsOptional()
  quantity?: string;

  @IsString()
  @IsOptional()
  boxQuantity?: string | null;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsOptional()
  boxPrice?: string | null;

  @IsString()
  @IsOptional()
  boxDiscountPrice?: string | null;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  quantity?: string;

  @IsString()
  @IsOptional()
  boxQuantity?: string | null;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}
