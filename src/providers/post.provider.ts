// post.providers.ts

import { Provider } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Variant } from 'src/entities/variant.entity';
import { CategoryPost } from 'src/entities/category-post.entity';
import { Category } from 'src/entities/category.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from 'src/services/notification.service';
import { Notification } from 'src/entities/notification.entity';
import { Transaction } from 'src/entities/transactions.entity';
import { Extend } from 'src/entities/extend.entity';

export const postProviders: Provider[] = [
  {
    provide: 'POST_REPOSITORY',
    useFactory: (
      postRepository: Repository<Post>,
      categoryPostRepository: Repository<CategoryPost>,
      variantRepository: Repository<Variant>,
      postMediaRepository: Repository<PostMedia>,
      categoryRepository: Repository<Category>,
      notificationService: NotificationService,
      transactionRepository: Repository<Transaction>,
      extendRepository: Repository<Extend>,
    ) => {
      return {
        postRepository,
        categoryPostRepository,
        variantRepository,
        postMediaRepository,
        categoryRepository,
        notificationService,
        transactionRepository,
        extendRepository,
      };
    },
    inject: [
      getRepositoryToken(Post),
      getRepositoryToken(CategoryPost),
      getRepositoryToken(Variant),
      getRepositoryToken(PostMedia),
      getRepositoryToken(Category),
      getRepositoryToken(Notification),
      getRepositoryToken(Transaction),
      getRepositoryToken(Extend),
    ],
  },
];
