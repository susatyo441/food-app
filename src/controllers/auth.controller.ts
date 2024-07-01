// src/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import * as mime from 'mime-types';
import * as fs from 'fs';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterOrganizationDto } from 'src/dto/organization.dto';
import { UserOrganization } from 'src/entities/user-organization.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
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
            fileExtension = 'jpeg'; // Rename bin to jpeg
          }
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
    }),
  )
  async register(
    @UploadedFile() profile_picture: Express.Multer.File,
    @Body() registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    if (!profile_picture) {
      throw new BadRequestException('Profile picture is required');
    }

    const url = this.configService.get<string>('URL');
    const mediaUrl = `${url}/${profile_picture.path
      .replace(/\\/g, '/')
      .replace('public/', '')}`;

    return this.authService.register(registerDto, mediaUrl);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: RegisterDto; token: string }> {
    const { user, token } = await this.authService.login(loginDto);
    return { user, token };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request) {
    const userId = request.user.id;
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @Post('register-organization')
  @UseInterceptors(
    FileInterceptor('profile_picture', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = 'public/organization';
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
  async register_organization(
    @UploadedFile() profile_picture: Express.Multer.File,
    @Body() registerDto: RegisterOrganizationDto, // Use your DTO
  ): Promise<UserOrganization> {
    if (!profile_picture) {
      throw new BadRequestException('Profile picture is required');
    }

    const url = this.configService.get<string>('URL');
    const mediaUrl = `${url}/${profile_picture.path
      .replace(/\\/g, '/')
      .replace('public/', '')}`;

    return this.authService.register_organization(registerDto, mediaUrl);
  }

  @Post('login-organization')
  async login_organization(@Body() body: any) {
    const { email, password } = body;
    return this.authService.login_organization(email, password);
  }

  private async saveFilesToStorage(
    files: Array<Express.Multer.File>,
  ): Promise<string[]> {
    const url = this.configService.get<string>('URL');
    const fileUrls: string[] = [];
    for (const file of files) {
      const fileUrl = `${url}/${file.path.replace(/\\/g, '/').replace('public/', '')}`;
      fileUrls.push(fileUrl);
    }
    return fileUrls;
  }
}
