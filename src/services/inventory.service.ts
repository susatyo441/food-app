import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { User } from '../entities/user.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { id } from 'date-fns/locale/id';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseAdminService,
    private readonly configService: ConfigService,
  ) {}

  async createInventory(
    userId: number,
    inventoryData: Partial<Inventory>,
    image: string,
  ): Promise<Inventory> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const inventory = this.inventoryRepository.create({
      ...inventoryData,
      image,
      user,
    });
    return this.inventoryRepository.save(inventory);
  }

  async getInventories(userId: number): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findInventoryById(
    userId: number,
    inventoryId: number,
  ): Promise<Inventory> {
    return this.inventoryRepository.findOne({
      where: { id: inventoryId, user: { id: userId } },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    timeZone: 'Asia/Jakarta', // Timezone WIB (UTC+7)
  }) // Jalankan setiap jam
  async checkExpiredInventory() {
    const formatExpiredAt = (date: Date | string) => {
      const timeZone = 'Asia/Jakarta';
      const zonedDate = toZonedTime(date, timeZone);
      return format(zonedDate, 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id });
    };

    const now = new Date();
    const inventories = await this.inventoryRepository.find({
      where: { expiredAt: LessThan(now), isNotify: false },
      relations: ['user'],
    });

    for (const inventory of inventories) {
      inventory.isNotify = true;
      await this.inventoryRepository.save(inventory);
      // Kirim notifikasi untuk setiap inventory yang sudah kedaluwarsa
      if (inventory.user.fcmToken) {
        const payload = {
          notification: {
            title: `${inventory.name} Anda telah kadaluwarsa!`,
            body: `${inventory.name} Anda telah kadaluwarsa pada ${formatExpiredAt(inventory.expiredAt)}`,
          },
          data: {
            type: 'inventory',
          },
          token: inventory.user.fcmToken,
        };

        try {
          await this.firebaseService.getMessaging().send(payload);
        } catch (error) {
          if (
            error.code === 'messaging/invalid-recipient' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            // Handle invalid token error
            console.log('Invalid FCM token:', error.message);
            return { success: false, error: 'Invalid FCM token' };
          } else {
            // Handle other errors
            console.log('FCM send error:', error.message);
            return { success: false, error: 'Failed to send notification' };
          }
        }
      }
    }
  }

  async updateQuantity(
    userId: number,
    id: number,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.findInventoryById(userId, id);
    inventory.quantity = quantity;
    return this.inventoryRepository.save(inventory);
  }

  async deleteInventory(userId: number, id: number): Promise<void> {
    const inventory = await this.findInventoryById(userId, id);
    if (inventory.image) {
      const filePath = inventory.image.replace(
        `${this.configService.get<string>('URL')}/`,
        'public/',
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file
      }
    }
    await this.inventoryRepository.remove(inventory);
  }
}
