// src/services/user.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
  async updateFcmToken(userId: number, fcmToken: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    user.fcmToken = fcmToken;
    return this.userRepository.save(user);
  }
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user;
  }

  async updateProfilePicture(
    user: User,
    newProfilePictureUrl: string,
  ): Promise<void> {
    user.profile_picture = newProfilePictureUrl;
    await this.userRepository.save(user);
  }

  async updateName(id: number, name: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = name; // Update nama pengguna

    return this.userRepository.save(user);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = this.userRepository.findOne({
      where: { email },
      select: ['password', 'token'], // Hanya menyertakan kolom password
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }
  async updateToken(userId: number, token: string | null): Promise<void> {
    await this.userRepository.update(userId, { token });
  }
}
