// // src/chat/chat.module.ts
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Chat } from '../entities/chat.entity';
// import { Conversation } from '../entities/conversation.entity';
// import { ChatService } from '../services/chat.service';
// import { ChatGateway } from '../gateway/chat.gateway';
// import { ConversationService } from '../services/conversation.service';

// @Module({
//   imports: [TypeOrmModule.forFeature([Chat, Conversation])],
//   providers: [ChatService, ChatGateway, ConversationService],
// })
// export class ChatModule {}
