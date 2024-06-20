// src/services/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { PointService } from './point.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly pointService: PointService,
  ) {}

  async register(
    userData: RegisterDto,
    urlPhoto: string,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await this.userService.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      gender: userData.gender,
      profile_picture: urlPhoto,
    });
    await this.pointService.createPoints(newUser);

    const token = await this.generateToken(newUser.email);
    return { user: newUser, token };
  }

  async login(loginData: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userService.findByEmailWithPassword(
      loginData.email,
    );
    const userData = await this.userService.findByEmail(loginData.email);

    if (user && (await bcrypt.compare(loginData.password, user.password))) {
      const token = await this.generateToken(userData.email);
      await this.userService.updateToken(userData.id, token);
      return { user: userData, token };
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(userId: number): Promise<void> {
    await this.userService.updateToken(userId, null);
  }

  private async generateToken(email: string): Promise<string> {
    const payload = { email: email };
    return await this.jwtService.signAsync(payload);
  }
}
