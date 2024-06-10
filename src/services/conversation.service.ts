// import {
//   Injectable,
//   NotFoundException,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Conversation } from '../entities/conversation.entity';
// import { User } from '../entities/user.entity';
// import { UserService } from '../services/user.service';

// @Injectable()
// export class ConversationService {
//   constructor(
//     @InjectRepository(Conversation)
//     private readonly conversationRepository: Repository<Conversation>,
//     private readonly userService: UserService,
//   ) {}

//   async findOrCreateConversation(
//     userDonorId: number,
//     userRecipientId: number,
//     sender: User,
//   ): Promise<Conversation> {
//     const userDonor = await this.userService.findById(userDonorId);
//     const userRecipient = await this.userService.findById(userRecipientId);

//     // Check if the sender is the recipient
//     if (sender.id !== userRecipientId) {
//       throw new UnauthorizedException(
//         'Only the recipient can start a conversation',
//       );
//     }

//     let conversation = await this.conversationRepository.findOne({
//       where: { userDonor, userRecipient },
//     });

//     if (!conversation) {
//       conversation = this.conversationRepository.create({
//         userDonor,
//         userRecipient,
//       });
//       await this.conversationRepository.save(conversation);
//     }

//     return conversation;
//   }

//   async findById(id: number): Promise<Conversation> {
//     const conversation = await this.conversationRepository.findOne(id, {
//       relations: ['userDonor', 'userRecipient', 'chats'],
//     });
//     if (!conversation) {
//       throw new NotFoundException('Conversation not found');
//     }
//     return conversation;
//   }
// }
