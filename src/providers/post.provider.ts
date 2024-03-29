// post.providers.ts

import { Provider } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Variant } from 'src/entities/variant.entity';
import { CategoryPost } from 'src/entities/category-post.entity';
import { Category } from 'src/entities/category.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Address } from 'src/entities/address.entity';

export const postProviders: Provider[] = [
  {
    provide: 'POST_REPOSITORY',
    useFactory: (
      postRepository: Repository<Post>,
      categoryPostRepository: Repository<CategoryPost>,
      variantRepository: Repository<Variant>,
      postMediaRepository: Repository<PostMedia>,
      categoryRepository: Repository<Category>,
      addressRepository: Repository<Address>,
    ) => {
      return {
        postRepository,
        categoryPostRepository,
        variantRepository,
        postMediaRepository,
        categoryRepository,
        addressRepository,
      };
    },
    inject: [
      getRepositoryToken(Post),
      getRepositoryToken(CategoryPost),
      getRepositoryToken(Variant),
      getRepositoryToken(PostMedia),
      getRepositoryToken(Category),
      getRepositoryToken(Address),
    ],
  },
];
