import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConversationsService } from '../services/conversation.service';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async getUserConversations(@Req() req) {
    const userId = req.user.id; // Assume `req.user` contains the authenticated user's information
    return this.conversationsService.getUserConversations(userId);
  }
}
