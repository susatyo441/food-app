import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterOrganizationDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  lat: string;

  @IsString()
  long: string;
}
