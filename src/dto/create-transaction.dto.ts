import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DetailDto {
  @IsNotEmpty()
  @IsNumber()
  variant_id: number;

  @IsNotEmpty()
  @IsNumber()
  jumlah: number;
}

export class CreateTransactionDto {
  @IsNotEmpty()
  post_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VariantDetailDto)
  detail: VariantDetailDto[];
}

export class VariantDetailDto {
  @IsNotEmpty()
  variant_id: number;

  @IsNotEmpty()
  jumlah: number;
}

export class ConfirmPengambilanDto {
  @IsNotEmpty()
  transactionId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  review: number;

  @IsOptional()
  comment?: string;
}

export enum TransactionRole {
  DONOR = 'donor',
  RECIPIENT = 'recipient',
}

export class GetTransactionsFilterDto {
  @IsOptional()
  @IsEnum(TransactionRole)
  role?: TransactionRole;
}
