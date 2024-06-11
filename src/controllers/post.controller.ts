import {
  Controller,
  Post,
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
import { CreatePostDto } from 'src/dto/post.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { PostService } from 'src/services/post.service';
import { CategoryService } from 'src/services/category.service';
import axios from 'axios';

@Controller('post')
@UseGuards(AuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly categoryService: CategoryService,
  ) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadFile(
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
    images: Array<Express.Multer.File>,
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const categories = await this.categoryService.find(
      createPostDto.categories,
    );

    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', Buffer.from(image.buffer), image.originalname);
    });

    const response = await axios.post(
      'http://localhost:3000/media/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const mediaUrls = response.data;

    return await this.postService.create(
      createPostDto,
      userId,
      categories,
      mediaUrls,
    );
  }
}
