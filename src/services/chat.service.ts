// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) {}

  async createChat(
    conversation: Conversation,
    message: string,
    type: number,
  ): Promise<Chat> {
    const chat = this.chatRepository.create({ conversation, message, type });
    return this.chatRepository.save(chat);
  }

  async findChatsByConversation(conversation: Conversation): Promise<Chat[]> {
    return this.chatRepository.find({
      where: { conversation },
      order: { createdAt: 'ASC' },
    });
  }
}
