import { IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AddressDto } from "./order.dto";
import { WholesaleOrderRequestStatus } from "../entities/wholesale-order-request.entity";

export class CreateWholesaleOrderRequestDto {
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  billingAddress?: AddressDto;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateWholesaleOrderRequestStatusDto {
  @IsEnum(WholesaleOrderRequestStatus)
  status: WholesaleOrderRequestStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

