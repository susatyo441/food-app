import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { User } from '../entities/user.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { differenceInHours, format, subHours, toDate } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { id } from 'date-fns/locale/id';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseAdminService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
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
    timeZone: 'Asia/Jakarta',
  })
  async checkExpiredInventory() {
    const formatExpiredAt = (date: Date | string) => {
      const timeZone = 'Asia/Jakarta';
      const zonedDate = toZonedTime(date, timeZone);
      return format(zonedDate, 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id });
    };

    const now = new Date();
    const nowZoned = toZonedTime(now, 'Asia/Jakarta');
    const eightHoursBeforeNow = subHours(nowZoned, -8);

    // Check for expired inventories
    const expiredInventories = await this.inventoryRepository.find({
      where: { expiredAt: LessThan(now), isNotify: false },
      relations: ['user'],
    });

    for (const inventory of expiredInventories) {
      inventory.isNotify = true;
      await this.inventoryRepository.save(inventory);
      await this.notificationService.createNotification(
        inventory.user,
        `${inventory.name} Anda telah kadaluwarsa!`,
        `${inventory.name} telah kadaluwarsa pada ${formatExpiredAt(inventory.expiredAt)}`,
        inventory.name,
      );
      if (inventory.user.fcmToken) {
        const payload = {
          notification: {
            title: `${inventory.name} Anda telah kadaluwarsa!`,
            body: `${inventory.name} telah kadaluwarsa pada ${formatExpiredAt(inventory.expiredAt)}`,
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
            console.log('Invalid FCM token:', error.message);
            return { success: false, error: 'Invalid FCM token' };
          } else {
            console.log('FCM send error:', error.message);
            return { success: false, error: 'Failed to send notification' };
          }
        }
      }
    }

    // Check for inventories expiring in 8 hours
    const inventoriesExpiringSoon = await this.inventoryRepository.find({
      where: { expiredAt: LessThan(eightHoursBeforeNow), isPreNotify: false },
      relations: ['user'],
    });

    for (const inventory of inventoriesExpiringSoon) {
      inventory.isPreNotify = true;
      await this.inventoryRepository.save(inventory);
      const hoursUntilExpired = differenceInHours(
        toDate(inventory.expiredAt),
        nowZoned,
      );

      if (hoursUntilExpired > 0) {
        await this.notificationService.createNotification(
          inventory.user,
          `${inventory.name} Anda akan kadaluwarsa dalam ${hoursUntilExpired} jam!`,
          `${inventory.name} akan kadaluwarsa pada ${formatExpiredAt(inventory.expiredAt)}`,
          inventory.name,
        );
        if (inventory.user.fcmToken) {
          const payload = {
            notification: {
              title: `${inventory.name} Anda akan kadaluwarsa dalam ${hoursUntilExpired} jam!`,
              body: `${inventory.name} akan kadaluwarsa pada ${formatExpiredAt(inventory.expiredAt)}`,
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
              console.log('Invalid FCM token:', error.message);
              return { success: false, error: 'Invalid FCM token' };
            } else {
              console.log('FCM send error:', error.message);
              return { success: false, error: 'Failed to send notification' };
            }
          }
        }
      }
    }
  }

  async updateQuantity(
    userId: number,
    id: number,
    quantity: number,
    expiredAt: Date,
  ): Promise<Inventory> {
    const inventory = await this.findInventoryById(userId, id);
    inventory.quantity = quantity;
    inventory.expiredAt = expiredAt;
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

  async getExpiredInventories(userId: number): Promise<Inventory[]> {
    const now = new Date();
    return this.inventoryRepository.find({
      where: { user: { id: userId }, expiredAt: LessThan(now) },
    });
  }

  async getInventoriesWithZeroQuantity(userId: number): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { user: { id: userId }, quantity: 0 },
    });
  }

  async getValidInventories(userId: number): Promise<Inventory[]> {
    const now = new Date();
    return this.inventoryRepository.find({
      where: {
        user: { id: userId },
        quantity: MoreThan(0),
        expiredAt: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
