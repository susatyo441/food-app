// notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private firebaseAdminService: FirebaseAdminService,
  ) {}

  async createNotification(
    user: User,
    title: string,
    message: string,
    name: string,
    transaction_id?: number,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      title,
      name,
      data: { transaction_id, message },
      isRead: false,
    });

    return await this.notificationRepository.save(notification);
  }

  async markAsRead(notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOneBy({
      id: notificationId,
    });
    if (notification) {
      notification.isRead = true;
      return await this.notificationRepository.save(notification);
    }
    return null;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const notifications = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    // Create a deep copy of the notifications
    const notificationsToUpdate = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));

    // Save the copied notifications with isRead set to true
    await this.notificationRepository.save(notificationsToUpdate);

    // Return the original notifications
    return notifications;
  }

  async checkUnreadNotifications(userId: number): Promise<boolean> {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
    return count > 0;
  }
}
