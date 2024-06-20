import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Points } from '../entities/point.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Points)
    private readonly pointRepository: Repository<Points>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createPoints(user: User): Promise<Points> {
    const userPoints = new Points();
    userPoints.user = user;
    userPoints.points = 0;
    return await this.pointRepository.save(userPoints);
  }

  async getPoints(userId: number): Promise<Points> {
    const points = await this.pointRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!points) {
      throw new NotFoundException('Points not found');
    }
    return points;
  }

  async updatePoints(userId: number, points: number): Promise<Points> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let userPoints = await this.pointRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!userPoints) {
      userPoints = new Points();
      userPoints.user = user;
    }

    userPoints.points = points;
    return await this.pointRepository.save(userPoints);
  }

  async tambahPoint(user: User, points: number): Promise<Points> {
    const userPoints = await this.pointRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!userPoints) {
      throw new NotFoundException('Point not found');
    }
    userPoints.points += points;
    return await this.pointRepository.save(userPoints);
  }

  async adjustPoints(
    userId: number,
    pointsAdjustment: number,
  ): Promise<Points> {
    const userPoints = await this.getPoints(userId);
    userPoints.points += pointsAdjustment;
    return await this.pointRepository.save(userPoints);
  }
}
