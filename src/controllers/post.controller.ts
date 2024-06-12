import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { CreatePostDto } from 'src/dto/post.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { PostService } from 'src/services/post.service';
import { CategoryService } from 'src/services/category.service';
import { diskStorage } from 'multer';
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
          const randomFilename = `${uniqueSuffix}.jpeg`;
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

    const mediaUrls = await this.saveFilesToStorage(images);

    return await this.postService.create(
      createPostDto,
      userId,
      categories,
      mediaUrls,
    );
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
