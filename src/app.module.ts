// src/modules/app.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { CategoryService } from './services/category.service';
import { MediaController } from './controllers/media.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { NotificationService } from './services/notification.service';

import { User } from 'src/entities/user.entity';
import { Post } from './entities/post.entity';
import { Category } from './entities/category.entity';
import { CategoryPost } from './entities/category-post.entity';
import { PostMedia } from './entities/post-media.entity';
import { Variant } from './entities/variant.entity';
import { Transaction } from './entities/transactions.entity';
import { Notification } from './entities/notification.entity';
import { postProviders } from './providers/post.provider';
import typeorm from './config/typeorm';

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
      Notification,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
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
    NotificationService,
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
