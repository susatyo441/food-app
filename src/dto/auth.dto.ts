// src/dto/auth.dto.ts
// src/dto/auth.dto.ts

import { IsEmail, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;

  @IsIn(['l', 'p'], { message: 'Invalid gender. Use "l" or "p".' })
  gender: string;
}
  
  export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
  }
  