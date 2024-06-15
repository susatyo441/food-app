// src/controllers/user.controller.ts

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from 'src/entities/user.entity';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Req() req: Request,
  ): Promise<{ users: User[]; user: User | null }> {
    const user = req['user']; // Mendapatkan informasi pengguna dari req['user']

    const users = await this.userService.findAll();

    return { users, user };
  }
  @UseGuards(AuthGuard)
  @Post('update-fcm-token')
  async updateFcmToken(@Req() req, @Body() body: { fcmToken: string }) {
    const userId = req.user.id; // Assume `req.user` contains the authenticated user's information
    return this.userService.updateFcmToken(userId, body.fcmToken);
  }
}
