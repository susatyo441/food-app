import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Extend } from '../entities/extend.entity';
import { Points } from '../entities/point.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ExtendService {
  private readonly maxPointsPerExtend = 100;

  constructor(
    @InjectRepository(Extend)
    private readonly extendRepository: Repository<Extend>,
    @InjectRepository(Points)
    private readonly pointRepository: Repository<Points>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createExtend(userId: number, amount: number): Promise<any> {
    const userPoints = await this.pointRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!userPoints || userPoints.points < amount) {
      throw new BadRequestException('Insufficient points');
    }

    userPoints.points -= amount;
    await this.pointRepository.save(userPoints);

    const extend = new Extend();
    extend.user = await this.userRepository.findOneBy({ id: userId });
    extend.amount = amount;
    extend.expiredAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // Expires in 30 days
    await this.extendRepository.save(extend);
    return { message: 'Limit berhasil ditambah +1' };
  }

  async getUserExtends(userId: number): Promise<Extend[]> {
    return await this.extendRepository.find({
      where: { user: { id: userId } },
    });
  }

  async getExtends(userId: number): Promise<Extend[]> {
    return await this.extendRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async deleteExtend(userId: number, extendId: number): Promise<void> {
    const extend = await this.extendRepository.findOne({
      where: { id: extendId, user: { id: userId } },
      relations: ['user'],
    });
    if (!extend) {
      throw new NotFoundException('Extend not found');
    }
    await this.extendRepository.remove(extend);
  }
  async countValidExtends(userId: number): Promise<number> {
    const now = new Date();
    return await this.extendRepository.count({
      where: {
        user: { id: userId },
        expiredAt: MoreThan(now),
      },
    });
  }
}
