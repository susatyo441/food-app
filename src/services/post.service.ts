import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from 'src/dto/post.dto';
import { Variant } from 'src/entities/variant.entity';
import { CategoryPost } from 'src/entities/category-post.entity';
import { Category } from 'src/entities/category.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import { Address } from 'src/entities/address.entity';

@Injectable()
export class PostService {
  constructor(
    @Inject('POST_REPOSITORY')
    private readonly repositories: {
      postRepository: Repository<Post>;
      categoryPostRepository: Repository<CategoryPost>;
      variantRepository: Repository<Variant>;
      postMediaRepository: Repository<PostMedia>;
      categoryRepository: Repository<Category>;
      addressRepository: Repository<Address>;
    },
  ) {}

  async create(
    postData: CreatePostDto,
    userId: number,
    categories: Category[],
    address: Address,
    urlPhotos: string[],
  ): Promise<Post> {
    console.log(postData);
    // Buat objek Post
    const post = this.repositories.postRepository.create({
      ...postData,
      user: { id: userId },
      address: address,
    });

    // Simpan objek Post ke dalam database
    const savedPost = await this.repositories.postRepository.save(post);

    for (const category of categories) {
      const categoryPost = this.repositories.categoryPostRepository.create({
        post: savedPost,
        category: category,
      });
      categoryPost.post = savedPost;
      categoryPost.category = category;
      await this.repositories.categoryPostRepository.save(categoryPost);
    }

    // Buat entri baru di tabel Variant

    for (const variantData of postData.variants) {
      const variant = this.repositories.variantRepository.create({
        post: savedPost,
        name: variantData.name,
        stok: variantData.stok,
        ...(variantData.startAt && { startAt: variantData.startAt }),
        ...(variantData.expiredAt && { expiredAt: variantData.expiredAt }),
      });
      // tambahkan properti lainnya sesuai kebutuhan
      await this.repositories.variantRepository.save(variant);
    }

    for (const urlPhoto of urlPhotos) {
      const postMedia = this.repositories.postMediaRepository.create({
        post: savedPost,
        url: urlPhoto,
      });
      await this.repositories.postMediaRepository.save(postMedia);
    }

    return savedPost;
  }

  async findAll(): Promise<Post[]> {
    return await this.repositories.postRepository.find();
  }

  async findOne(id: number, user_id: number): Promise<Post> {
    const post = await this.repositories.postRepository.findOne({
      where: { user: { id: user_id }, id: id },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(
    id: number,
    postData: Partial<Post>,
    user_id: number,
  ): Promise<Post> {
    await this.findOne(id, user_id);

    await this.repositories.postRepository.update(id, postData);
    return await this.findOne(id, user_id);
  }

  async remove(id: number, user_id: number): Promise<void> {
    const post = await this.findOne(id, user_id);
    await this.repositories.postRepository.remove(post);
  }
}
