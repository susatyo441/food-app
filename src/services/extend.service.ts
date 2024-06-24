import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, Repository } from 'typeorm';
import { Extend } from '../entities/extend.entity';
import { Points } from '../entities/point.entity';
import { User } from '../entities/user.entity';
import * as moment from 'moment-timezone';
import { Transaction } from 'src/entities/transactions.entity';

@Injectable()
export class ExtendService {
  private readonly maxPointsPerExtend = 100;
  private readonly maksimal_pengambilan = 3;

  constructor(
    @InjectRepository(Extend)
    private readonly extendRepository: Repository<Extend>,
    @InjectRepository(Points)
    private readonly pointRepository: Repository<Points>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
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

  async getExtends(userId: number): Promise<any> {
    return (
      (await this.extendRepository.count({
        where: { user: { id: userId } },
      })) + this.maksimal_pengambilan
    );
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

  async countValidExtend(userId: number): Promise<any> {
    const jakartaTimezone = 'Asia/Jakarta';

    const startOfDay = moment.tz(jakartaTimezone).startOf('day').toDate();
    const endOfDay = moment.tz(jakartaTimezone).endOf('day').toDate();

    const count_pengambilan = await this.transactionRepository.count({
      where: {
        userRecipient: { id: userId },
        createdAt: Between(startOfDay, endOfDay), // Menggunakan Between dari TypeORM
      },
    });

    const nowJakarta = moment.tz(jakartaTimezone).toDate();

    const count = await this.extendRepository.count({
      where: {
        user: { id: userId },
        expiredAt: MoreThan(nowJakarta),
      },
    });

    return { message: 3 + count, current: 3 + count - count_pengambilan };
  }
}
