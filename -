import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  boxPrice?: number | null;

  @IsNumber()
  @IsOptional()
  boxDiscountPrice?: number | null;

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

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  boxPrice?: number | null;

  @IsNumber()
  @IsOptional()
  boxDiscountPrice?: number | null;

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
