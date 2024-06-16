import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { CreateMessageDto } from 'src/dto/message.dto';
import { Conversation } from 'src/entities/conversation.entity';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private firebaseAdminService: FirebaseAdminService,
  ) {}

  async getMessagesBetweenUsers(
    userId: number,
    otherUserId: number,
  ): Promise<any[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const otherUser = await this.usersRepository.findOne({
      where: { id: otherUserId },
    });

    const messages = await this.messagesRepository.find({
      where: [
        { sender: user, receiver: otherUser },
        { sender: otherUser, receiver: user },
      ],
      order: { timestamp: 'asc' },
      relations: ['sender', 'file'], // Ensure relations are loaded
    });

    // Mark messages as read
    await this.messagesRepository.update(
      { receiver: user, sender: otherUser, is_read: false },
      { is_read: true },
    );

    return messages.map((message) => ({
      id: message.id,
      message: message.message,
      timestamp: message.timestamp,
      is_read: message.is_read,
      isSentByMe: message.sender.id === userId,
      name: message.sender.name,
      profile_picture: message.sender.profile_picture,
      file: message.file ? message.file.file_path : null,
    }));
  }

  async createMessage(
    senderId: number,
    createMessageDto: CreateMessageDto,
    mediaUrl?: string,
  ): Promise<any> {
    const { receiverId, message: messageText } = createMessageDto;

    const sender = await this.usersRepository.findOneBy({ id: senderId });
    const receiver = await this.usersRepository.findOneBy({ id: receiverId });

    let savedFile = null;
    if (mediaUrl) {
      const newFile = new File();
      newFile.user = sender;
      newFile.file_path = mediaUrl;
      newFile.file_name = mediaUrl.split('/').pop(); // Extract the file name from the URL
      newFile.file_type = mediaUrl.split('.').pop(); // Extract the file extension from the URL
      savedFile = await this.filesRepository.save(newFile);
    }

    const message = new Message();
    message.sender = sender;
    message.receiver = receiver;
    message.message = messageText;
    message.file = savedFile;

    const savedMessage = await this.messagesRepository.save(message);

    // Update or create conversation
    const conversation = await this.conversationsRepository.findOne({
      where: [
        { user1: sender, user2: receiver },
        { user1: receiver, user2: sender },
      ],
    });

    if (conversation) {
      conversation.lastMessage = savedMessage;
      conversation.last_update = new Date();
      await this.conversationsRepository.save(conversation);
    } else {
      const newConversation = new Conversation();
      newConversation.user1 = sender;
      newConversation.user2 = receiver;
      newConversation.lastMessage = savedMessage;
      newConversation.last_update = new Date();
      await this.conversationsRepository.save(newConversation);
    }

    if (receiver.fcmToken) {
      const payload = {
        notification: {
          title: `New message from ${sender.name}`,
          body: messageText || 'You received a new file',
        },
        data: {
          id: savedMessage.id.toString(),
          message: messageText || '',
          timestamp: savedMessage.timestamp.toISOString(),
          is_read: savedMessage.is_read.toString(),
          isSentByMe: 'false',
          name: sender.name,
          profile_picture:
            sender.profile_picture ||
            'https://static.vecteezy.com/system/resources/previews/026/630/551/original/profile-icon-symbol-design-illustration-vector.jpg',
          file: savedMessage?.file ? savedMessage.file.file_path : '',
        },
        token: receiver.fcmToken,
      };

      this.firebaseAdminService.getMessaging().send(payload);
    }

    return {
      id: savedMessage.id,
      message: savedMessage.message,
      file: savedMessage?.file ? savedMessage.file.file_path : null,
      sender: {
        id: sender.id,
        username: sender.name,
        profilePicture: sender.profile_picture, // Assumes User entity has profilePicture field
      },
      isRead: savedMessage.is_read,
      timestamp: savedMessage.timestamp,
    };
  }
}
