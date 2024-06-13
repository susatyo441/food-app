import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from 'src/dto/post.dto';
import { Variant } from 'src/entities/variant.entity';
import { CategoryPost } from 'src/entities/category-post.entity';
import { Category } from 'src/entities/category.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import * as geolib from 'geolib';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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
    },
  ) {}

  async create(
    postData: CreatePostDto,
    userId: number,
    categories: Category[],
    urlPhotos: string[],
  ): Promise<Post> {
    console.log(postData);

    // Buat objek Post
    const post = this.repositories.postRepository.create({
      ...postData,
      user: { id: userId },
    });

    // Simpan objek Post ke dalam database
    const savedPost = await this.repositories.postRepository.save(post);

    for (const category of categories) {
      const categoryPost = this.repositories.categoryPostRepository.create({
        post: savedPost,
        category: category,
      });
      await this.repositories.categoryPostRepository.save(categoryPost);
    }

    for (const variantData of postData.variants) {
      const variant = this.repositories.variantRepository.create({
        post: savedPost,
        name: variantData.name,
        stok: variantData.stok,
        ...(variantData.startAt && { startAt: variantData.startAt }),
        ...(variantData.expiredAt && { expiredAt: variantData.expiredAt }),
      });
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

  async findPostsByLocation(
    lat: number,
    lon: number,
    search?: string,
  ): Promise<any[]> {
    const now = new Date();

    // Get all posts with status 'visible'
    const query = this.repositories.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.variants', 'variants')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.status = :status', { status: 'visible' });

    // Add search condition if search query is provided
    if (search) {
      query.andWhere('post.title LIKE :search', { search: `%${search}%` });
    }

    const posts = await query.getMany();

    // Filter out posts with expired variants or where all variants are out of stock
    const validPosts = posts.filter((post) => {
      const variantsAvailable = post.variants.some(
        (variant) =>
          variant.stok > 0 &&
          (!variant.expiredAt || new Date(variant.expiredAt) > now),
      );
      return variantsAvailable;
    });

    // Calculate distance and format based on length
    const postsWithDistance = validPosts
      .map((post) => {
        const distance = geolib.getDistance(
          { latitude: lat, longitude: lon },
          {
            latitude: parseFloat(post.body.coordinate.split(',')[0]),
            longitude: parseFloat(post.body.coordinate.split(',')[1]),
          },
        );

        let distanceText = `${distance} meter dari lokasi Anda`;
        if (distance >= 1000) {
          distanceText = `${(distance / 1000).toFixed(1)} km dari lokasi Anda`;
        }

        return {
          id: post.id,
          title: post.title,
          body: post.body,
          status: post.status,
          createdAt: `Diposting ${formatDistanceToNow(new Date(post.createdAt), { locale: id })} yang lalu`,
          updatedAt: `Diupdate ${formatDistanceToNow(new Date(post.updatedAt), { locale: id })} yang lalu`,
          firstVariantExpiredAt: post.variants[0]
            ? `Kadaluwarsa dalam ${formatDistanceToNow(new Date(post.variants[0].expiredAt), { locale: id })}`
            : 'Tidak tersedia',
          distance: distanceText,
          stok: post.variants.reduce(
            (total, variant) => total + variant.stok,
            0,
          ),
          userName: post.user.name,
          userId: post.user.id,
          userProfilePicture: post.user.profile_picture,
          distanceValue: distance, // Include raw distance value for filtering
        };
      })
      .filter((post) => post.distanceValue <= 10000); // Filter out posts beyond 10 km

    // Sort posts by distance
    postsWithDistance.sort((a, b) => a.distanceValue - b.distanceValue);

    return postsWithDistance.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      firstVariantExpiredAt: post.firstVariantExpiredAt,
      distance: post.distance,
      stok: post.stok,
      userId: post.userId,
      userName: post.userName,
      userProfilePicture: post.userProfilePicture,
    }));
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
