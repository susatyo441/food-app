import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  Req,
  Get,
  Patch,
  Query,
  UseGuards,
  Param,
  Delete,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Post as PostEntity } from '../entities/post.entity';
import { ConfigService } from '@nestjs/config';
import { CreatePostDto } from 'src/dto/post.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { PostService } from 'src/services/post.service';
import * as mime from 'mime-types';
import { CategoryService } from 'src/services/category.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from 'src/services/user.service';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/guard/organization.guard';
import { PostRequestService } from 'src/services/post-request.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly categoryService: CategoryService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly postRequestService: PostRequestService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
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
  async uploadFile(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() createPostDto: CreatePostDto,
    @Req() req,
  ) {
    if (!images || images.length === 0) {
      throw new BadRequestException('Images are required');
    }

    const userId = req.user.id;
    const categories = await this.categoryService.find(
      createPostDto.categories,
    );

    // Generate URLs for the uploaded images
    const mediaUrls = await this.saveFilesToStorage(images);

    // Save post with associated media URLs
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
    const fileUrls: string[] = [];
    for (const file of files) {
      const url = this.configService.get<string>('URL');
      const fileUrl = `${url}/${file.path.replace(/\\/g, '/').replace('public/', '')}`;
      fileUrls.push(fileUrl);
    }
    return fileUrls;
  }

  @UseGuards(AuthGuard)
  @Get()
  async getNearbyPosts(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('search') search?: string,
  ): Promise<PostEntity[]> {
    return this.postService.findPostsByLocation(lat, lon, search);
  }

  @UseGuards(AuthGuard)
  @Get('user')
  async getUserPosts(@Req() request): Promise<any[]> {
    return this.postService.getUserPost(request.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('find/:id')
  async findPostById(
    @Param('id') id: number,
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Req() req,
  ): Promise<any> {
    const userId = req.user.id;
    return this.postService.findPostById(id, lat, lon, userId);
  }

  @UseGuards(AuthGuard)
  @Get('recent')
  async getRecentPosts(
    @Query('lat') lat: number,
    @Query('lon') lon: number,
  ): Promise<any[]> {
    return this.postService.findRecentPosts(lat, lon);
  }

  @UseGuards(AuthGuard)
  @Post('report/:id')
  async reportPost(
    @Param('id') id: number,
    @Req() req,
    @Body('reason') reason: string,
    @Body('transactionId') transactionId: number,
  ) {
    const userId = req.user.id;
    const reporter = await this.userService.findById(userId);
    return this.postService.reportPost(id, reporter, reason, transactionId);
  }
  @Patch('hide/:id')
  async hidePost(@Param('id') postId: number): Promise<void> {
    await this.postService.hidePost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async createPostRequest(@Req() req, @Body('request') request: string) {
    const userId = req.user.sub;
    return this.postRequestService.createPostRequest(userId, request);
  }

  @Get('request')
  async getPostsSortedByLocation(
    @Query('lat') lat: number,
    @Query('long') long: number,
  ) {
    return this.postRequestService.getPostsSortedByLocation(lat, long);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-request/:id')
  async deletePostRequest(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.postRequestService.deletePostRequest(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-org')
  async getAllPostsByUser(@Req() req): Promise<any> {
    const userId = req.user.sub; // Assuming user id is stored in request
    const posts = await this.postRequestService.getAllPostsByUser(userId);

    return posts.map((post) => ({
      id: post.id,
      request: post.request,
      createdAt: post.createdAt,
      user: {
        id: post.userOrganization.id,
        name: post.userOrganization.name,
        profilePicture: post.userOrganization.profile_picture,
        address: post.userOrganization.address,
        email: post.userOrganization.email,
      },
    }));
  }
}
