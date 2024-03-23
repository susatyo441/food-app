// src/services/auth.service.ts

import { Injectable, UnauthorizedException, HttpStatus  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userData: RegisterDto): Promise<{ user: User, token: string }> {
    try {
      // Check if user with the given email already exists
      const existingUser = await this.userService.findByEmail(userData.email);
      if (existingUser) {
        throw new UnauthorizedException('User with this email already exists');
      }

      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create a new user in the database using TypeORM
      const newUser = await this.userService.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        gender: userData.gender,
      });

      // Generate token after registration
      const token = await this.generateToken(newUser.email);

      // Return user information and token
      return { user: newUser, token };
    } catch (error) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  async login(loginData: LoginDto): Promise<{ user: User, token: string }> {
    // Find the user by email
    const user = await this.userService.findByEmailWithPassword(loginData.email);
    const user_data = await this.userService.findByEmail(loginData.email);
    // Check if user exists and verify the password
    if (user && (await bcrypt.compare(loginData.password, user.password))) {
      return { user: user_data, token:await this.generateToken(user_data.email) };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async generateToken(email: string): Promise<string> {
    const payload = { email:email };
    return await this.jwtService.signAsync(payload);
  }
}
