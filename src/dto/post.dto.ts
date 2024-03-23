import {
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  IsString,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  address_id: number;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  variants: Variant[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  categories: number[];
}

export class Variant {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  stok: number;

  @IsOptional()
  startAt: Date;

  @IsOptional()
  expiredAt: Date;
}
