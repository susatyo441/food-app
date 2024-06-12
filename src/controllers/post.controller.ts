import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  ParseFilePipeBuilder,
  HttpStatus,
  UploadedFiles,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import * as FormData from 'form-data';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseFilesPipe } from '../pipes/file-type-validation.pipe';
import { ConfigService } from '@nestjs/config';
import { CreatePostDto } from 'src/dto/post.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { PostService } from 'src/services/post.service';
import { CategoryService } from 'src/services/category.service';
import axios from 'axios';
import { Post as PostEntity } from '../entities/post.entity';
import { diskStorage } from 'multer';
import * as mimeTypes from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

@Controller('post')
@UseGuards(AuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: 'public/media',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const fileExtension = mimeTypes.extension(file.mimetype); // Dapatkan ekstensi file berdasarkan tipe MIME
          const randomFilename = `${uniqueSuffix}.${fileExtension}`;
          cb(null, randomFilename);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFiles()
    images: Array<Express.Multer.File>,
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const categories = await this.categoryService.find(
      createPostDto.categories,
    );

    // const formData = new FormData();
    // images.forEach((image) => {
    //   formData.append('images', Buffer.from(image.buffer), image.originalname);
    // });

    const mediaUrls = await this.saveFilesToStorage(images);

    return await this.postService.create(
      createPostDto,
      userId,
      categories,
      mediaUrls,
    );
  }

  @Get('nearby')
  async getNearbyPosts(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ): Promise<PostEntity[]> {
    return this.postService.findPostsByLocation(lat, lon);
  }

  private async saveFilesToStorage(
    files: Array<Express.Multer.File>,
  ): Promise<string[]> {
    const fileUrls: string[] = [];
    for (const file of files) {
      const fileUrl = `http://localhost:3000/${file.path.replace(/\\/g, '/').replace('public/', '')}`;
      fileUrls.push(fileUrl);
    }
    return fileUrls;
  }
}
