// src/controllers/user.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from 'src/entities/user.entity';
import { AuthGuard } from 'src/guard/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(
    @Req() req: Request,
  ): Promise<{ users: User[]; user: User | null }> {
    const user = req['user']; // Mendapatkan informasi pengguna dari req['user']

    const users = await this.userService.findAll();

    return { users, user };
  }
  @UseGuards(AuthGuard)
  @Post('update-fcm-token')
  async updateFcmToken(@Req() req, @Body() body: { fcmToken: string }) {
    const userId = req.user.id; // Assume `req.user` contains the authenticated user's information
    return this.userService.updateFcmToken(userId, body.fcmToken);
  }
  @UseGuards(AuthGuard)
  @Post('profile/picture')
  @UseInterceptors(
    FileInterceptor('profile_picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'public/media';
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          let fileExtension = mime.extension(file.mimetype);
          if (fileExtension === 'bin') {
            fileExtension = 'jpg'; // Rename bin to jpg
          }
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
    }),
  )
  async updateProfilePicture(
    @UploadedFile() profilePicture: Express.Multer.File,
    @Req() req,
  ): Promise<{ success: boolean; newProfilePicture: string }> {
    if (!profilePicture) {
      throw new BadRequestException('Profile picture is required');
    }

    const user = await this.userService.findById(req.user.id); // Ambil data user

    if (user.profile_picture) {
      // Jika ada foto profil sebelumnya
      const oldPicturePath = this.getPicturePathFromUrl(user.profile_picture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath); // Hapus foto lama
      }
    }

    const url = this.configService.get<string>('URL');
    const mediaUrl = `${url}/${profilePicture.path
      .replace(/\\/g, '/')
      .replace('public/', '')}`;

    await this.userService.updateProfilePicture(user, mediaUrl);

    return { success: true, newProfilePicture: mediaUrl };
  }

  private getPicturePathFromUrl(url: string): string {
    // Ekstrak path dari URL gambar (sesuaikan dengan struktur URL Anda)
    const path = url.replace(
      this.configService.get<string>('URL') + '/',
      'public/',
    );
    return path;
  }

  @UseGuards(AuthGuard)
  @Put('update')
  async updateProfile(@Req() req, @Body('name') name: string): Promise<User> {
    return this.userService.updateName(req.user.id, name);
  }
}
