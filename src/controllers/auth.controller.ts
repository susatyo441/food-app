// src/controllers/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { User } from 'src/entities/user.entity';
import { ParseFilesPipe } from 'src/pipes/file-type-validation.pipe';
import axios from 'axios';
import * as FormData from 'form-data';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FilesInterceptor('profile_picture', 1))
  async register(
    @UploadedFiles(
      new ParseFilesPipe(
        new ParseFilePipeBuilder()
          .addFileTypeValidator({
            fileType: /(jpg|jpeg|png)$/,
          })
          .addMaxSizeValidator({ maxSize: 5242880 })
          .build({
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          }),
      ),
    )
    profile_picture: Array<Express.Multer.File>,
    @Body() registerDto: RegisterDto,
  ): Promise<{ user: User; token: string }> {
    const formData = new FormData();
    profile_picture.forEach((image) => {
      return formData.append(
        'images',
        Buffer.from(image.buffer),
        image.originalname,
      );
    });

    try {
      const response = await axios.post(
        'http://localhost:3000/media/upload-pfp',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const mediaUrls = response.data;
      return this.authService.register(registerDto, mediaUrls);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data || error.message;
        throw new HttpException(
          {
            status: error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            error: errorMessage,
          },
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Unexpected error occurred',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
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
}
