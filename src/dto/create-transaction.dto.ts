import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
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
  @IsNumber()
  post_id: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DetailDto)
  detail: DetailDto;
}
