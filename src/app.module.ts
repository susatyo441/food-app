// src/modules/app.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
// import { HttpModule } from '@nestjs/axios';
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
import { LocationService } from './services/location.service';
import { LocationController } from './controllers/location.controller';
import { NotificationController } from './controllers/notification.controller';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { ConversationsController } from './controllers/conversation.controller';
import { MessagesController } from './controllers/message.controller';
import { MessagesService } from './services/message.service';
import { ConversationsService } from './services/conversation.service';
import { File } from './entities/file.entity';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { Extend } from './entities/extend.entity';
import { Points } from './entities/point.entity';
import { ExtendService } from './services/extend.service';
import { PointService } from './services/point.service';
import { PointController } from './controllers/point.controller';
import { Recipe } from './entities/recipe.entity';
import { RecipeService } from './services/recipe.service';
import { RecipeController } from './controllers/recipe.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryService } from './services/inventory.service';
import { Inventory } from './entities/inventory.entity';
import { InventoryController } from './controllers/inventory.controller';
import { JwtAuthGuard } from './guard/organization.guard';
import { PostRequestService } from './services/post-request.service';
import { PostRequest } from './entities/post-request.entity';
import { UserOrganization } from './entities/user-organization.entity';

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
      File,
      Message,
      Conversation,
      Extend,
      Points,
      Recipe,
      Inventory,
      PostRequest,
      UserOrganization,
    ]),
    ScheduleModule.forRoot(),
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
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '30d' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    // HttpModule.register({
    //   baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // }),
  ],
  providers: [
    UserService,
    AuthService,
    PostService,
    CategoryService,
    TransactionService,
    NotificationService,
    LocationService,
    FirebaseAdminService,
    MessagesService,
    ConversationsService,
    ExtendService,
    PointService,
    RecipeService,
    InventoryService,
    JwtAuthGuard,
    PostRequestService,
    ...postProviders,
  ],
  controllers: [
    UserController,
    AuthController,
    PostController,
    MediaController,
    TransactionController,
    LocationController,
    NotificationController,
    ConversationsController,
    MessagesController,
    PointController,
    RecipeController,
    InventoryController,
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}
