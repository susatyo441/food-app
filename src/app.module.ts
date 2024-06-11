// src/modules/app.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller'; // Import AuthController
import { AuthService } from './services/auth.service'; // Import AuthService
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
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
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TransactionService } from './services/transaction.service';
import { Transaction } from './entities/transactions.entity';
import { TransactionController } from './controllers/transaction.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Post,
      Category,
      CategoryPost,
      PostMedia,
      Transaction,
      Variant,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }), // Menghapus tanda koma yang tidak semestinya di sini
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
    PostService,
    CategoryService,
    TransactionService,
    ...postProviders,
  ],
  controllers: [
    UserController,
    AuthController,
    PostController,
    MediaController,
    TransactionController,
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}
