import { IsString, IsNumber, Min, Matches, IsNotEmpty } from "class-validator";

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @Matches(/^\d{13,19}$/, { message: "Invalid card number" })
  cardNumber: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, {
    message: "Invalid expiration date (MM/YY)",
  })
  expirationDate: string;

  @IsString()
  @Matches(/^\d{3,4}$/, { message: "Invalid CVV" })
  cardCode: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class RefundPaymentDto {
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;
}
