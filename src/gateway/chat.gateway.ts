// // src/chat/chat.gateway.ts
// import {
//   WebSocketGateway,
//   SubscribeMessage,
//   WebSocketServer,
//   OnGatewayInit,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { ChatService } from '../services/chat.service';
// import { ConversationService } from '../services/conversation.service';

// @WebSocketGateway()
// export class ChatGateway
//   implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer() server: Server;

//   constructor(
//     private chatService: ChatService,
//     private conversationService: ConversationService,
//   ) {}

//   afterInit(server: Server) {
//     console.log('WebSocket server initialized');
//   }

//   handleConnection(client: Socket, ...args: any[]) {
//     console.log(`Client connected: ${client.id}`);
//   }

//   handleDisconnect(client: Socket) {
//     console.log(`Client disconnected: ${client.id}`);
//   }

//   @SubscribeMessage('sendMessage')
//   async handleMessage(
//     client: Socket,
//     payload: {
//       userDonorId: number;
//       userRecipientId: number;
//       message: string;
//       type: number;
//     },
//   ) {
//     const { userDonorId, userRecipientId, message, type } = payload;
//     const conversation =
//       await this.conversationService.findOrCreateConversation(
//         userDonorId,
//         userRecipientId,
//       );
//     const chat = await this.chatService.createChat(conversation, message, type);
//     this.server.emit('message', chat);
//   }
// }
