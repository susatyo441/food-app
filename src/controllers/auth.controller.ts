// src/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('profile_picture', {
      // Use FileInterceptor for a single file
      storage: diskStorage({
        destination: 'public/media',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          cb(null, `${uniqueSuffix}.jpeg`); // Always save as JPEG
        },
      }),
    }),
  )
  async register(
    @UploadedFile() profile_picture: Express.Multer.File,
    @Body() registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    const url = this.configService.get<string>('URL');
    const mediaUrl = `${url}/${profile_picture.path.replace(/\\/g, '/').replace('public/', '')}`;

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
