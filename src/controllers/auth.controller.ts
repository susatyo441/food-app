// src/controllers/auth.controller.ts

import { Controller, Post, Body, BadRequestException  } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<{ user: RegisterDto, token: string }> {
    try {
      const { user, token } = await this.authService.register(registerDto);
      return { user, token };
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Handle validation errors
        const validationErrors = error.getResponse();
        throw new BadRequestException({
          statusCode: 400,
          message: 'Bad Request',
          errors: validationErrors,
        });
      }
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ user: RegisterDto, token: string }> {
    const { user, token } = await this.authService.login(loginDto);
    return { user, token };
  }
}
