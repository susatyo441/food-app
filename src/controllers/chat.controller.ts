// // src/chat/chat.controller.ts
// import {
//   Controller,
//   Post,
//   Body,
//   UseGuards,
//   Request,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { AuthGuard } from '../guard/auth.guard';
// import { ChatService } from '../services/chat.service';
// import { ConversationService } from '../services/conversation.service';

// @Controller('chat')
// export class ChatController {
//   constructor(
//     private readonly chatService: ChatService,
//     private readonly conversationService: ConversationService,
//   ) {}

//   @UseGuards(AuthGuard)
//   @Post('send-message-recipient')
//   async sendMessage(
//     @Request() req,
//     @Body('userDonorId') userDonorId: number,
//     @Body('message') message: string,
//     @Body('type') type: number,
//   ) {
//     const recipient = req.user;
//     const recipientId = recipient.id; // Sender is always the donor

//     const conversation =
//       await this.conversationService.findOrCreateConversation(
//         userDonorId,
//         recipientId,
//         recipient,
//       );

//     const chat = await this.chatService.createChat(conversation, message, type);
//     return { chat };
//   }
// }
