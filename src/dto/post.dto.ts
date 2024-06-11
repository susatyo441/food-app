import {
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostBody {
  @IsNotEmpty()
  @IsString()
  alamat: string;

  @IsOptional()
  @IsString()
  coordinate?: string;
}

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PostBody)
  body: PostBody;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => Variant)
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
