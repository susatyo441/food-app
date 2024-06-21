import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Req() req): Promise<any[]> {
    const userId = req.user.id; // Get userId from req.user.id
    return this.notificationService.getUserNotifications(userId);
  }

  //   @Post('register-token')
  //   async registerToken(@Req() req, @Body('token') token: string) {
  //     const userId = req.user.id;
  //     await this.notificationService.registerToken(userId, token);
  //     return { message: 'Token registered successfully' };
  //   }

  @Get('unread-check')
  async checkUnreadNotifications(@Req() req): Promise<{ hasUnread: boolean }> {
    const hasUnread = await this.notificationService.checkUnreadNotifications(
      req.user.id,
    );
    return { hasUnread };
  }
}
