// src/controllers/user.controller.ts

import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from 'src/entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<{ users: User[]; user: User | null }> {
    const user = req['user']; // Mendapatkan informasi pengguna dari req['user']

    const users = await this.userService.findAll();

    return { users, user };
  }
}
