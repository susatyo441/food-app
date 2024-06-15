import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserConversations(userId: number): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    const conversations = await this.conversationsRepository.find({
      where: [{ user1: user }, { user2: user }],
      relations: ['user1', 'user2', 'lastMessage'],
    });

    const results = [];
    for (const conversation of conversations) {
      const otherUser =
        conversation.user1.id === userId
          ? conversation.user2
          : conversation.user1;
      const unreadMessagesCount = await this.messagesRepository.count({
        where: {
          receiver: user,
          sender: otherUser,
          is_read: false,
        },
      });

      results.push({
        conversationId: conversation.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.name,
        },
        lastMessage: conversation.lastMessage,
        unreadMessagesCount,
        lastUpdate: conversation.last_update,
      });
    }
    return results;
  }
}
