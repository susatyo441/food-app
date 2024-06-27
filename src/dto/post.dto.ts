import {
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  IsString,
  ArrayMaxSize,
  IsOptional,
  IsObject,
} from 'class-validator';

class PostBody {
  @IsNotEmpty()
  @IsString()
  alamat: string;

  @IsNotEmpty()
  @IsString()
  coordinate: string;

  @IsOptional()
  @IsString()
  deskripsi?: string;
}

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsObject()
  body: PostBody;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  variants: Variant[];

  @IsNotEmpty()
  categories: number;
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
