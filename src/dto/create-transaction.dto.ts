import {
  ArrayNotEmpty,
  IsArray,
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
