// src/address/dto/address.dto.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  provinsi: string;

  @IsNotEmpty()
  @IsString()
  kota: string;

  @IsNotEmpty()
  @IsString()
  kecamatan: string;

  @IsNotEmpty()
  @IsString()
  kode_pos: string;

  @IsNotEmpty()
  @IsString()
  alamat: string;

  @IsOptional()
  @IsString()
  coordinate?: string;
}
