// src/modules/app.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from './config/config.module';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller'; // Import AuthController
import { AuthService } from './services/auth.service'; // Import AuthService
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AddressController } from 'src/controllers/address.controller';
import { AddressService } from 'src/services/address.service';
import { Address } from 'src/entities/address.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { Post } from './entities/post.entity';
import { Category } from './entities/category.entity';
import { CategoryPost } from './entities/category-post.entity';
import { PostMedia } from './entities/post-media.entity';
import { Variant } from './entities/variant.entity';
import { postProviders } from './providers/post.provider';
import { HttpModule } from '@nestjs/axios';
import { CategoryService } from './services/category.service';
import { MediaController } from './controllers/media.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Address,
      Post,
      Category,
      CategoryPost,
      PostMedia,
      Variant,
    ]),
    ConfigModule,
    JwtModule.register({
      global: true,
      secret: 'AEA9448136237662FAC22EE5212C8',
      signOptions: { expiresIn: '30d' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    HttpModule.register({
      baseURL: 'http://localhost:3000',
    }),
  ],
  providers: [
    UserService,
    AuthService,
    AddressService,
    PostService,
    CategoryService,
    ...postProviders,
  ], // Tambahkan AuthService ke dalam providers
  controllers: [
    UserController,
    AuthController,
    AddressController,
    PostController,
    MediaController,
  ], // Tambahkan AuthController ke dalam controllers
  exports: [TypeOrmModule],
})
export class AppModule {}
