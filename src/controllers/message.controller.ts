import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MessagesService } from '../services/message.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import * as fs from 'fs';
import { CreateMessageDto } from 'src/dto/message.dto';
import { ConfigService } from '@nestjs/config';

@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':otherUserId')
  async getMessagesBetweenUsers(
    @Req() req,
    @Param('otherUserId') otherUserId: number,
  ) {
    const userId = req.user.id; // Assume `req.user` contains the authenticated user's information
    return this.messagesService.getMessagesBetweenUsers(userId, otherUserId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'public/files';
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          let fileExtension = mime.extension(file.mimetype);
          if (fileExtension === 'bin') {
            fileExtension = 'jpeg'; // Rename bin to jpeg
          }
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
    }),
  )
  async createMessage(
    @UploadedFile() file: Express.Multer.File,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req,
  ) {
    const userId = req.user.id; // Assume `req.user` contains the authenticated user's information
    let mediaUrl = null;
    if (file) {
      const url = this.configService.get<string>('URL');
      mediaUrl = `${url}/${file.path
        .replace(/\\/g, '/')
        .replace('public/', '')}`;
    }

    return this.messagesService.createMessage(
      userId,
      createMessageDto,
      mediaUrl,
    );
  }
}
