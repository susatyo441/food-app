import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Like, Repository, Raw } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from 'src/dto/post.dto';
import { Variant } from 'src/entities/variant.entity';
import { CategoryPost } from 'src/entities/category-post.entity';
import { Category } from 'src/entities/category.entity';
import { PostMedia } from 'src/entities/post-media.entity';
import * as geolib from 'geolib';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { NotificationService } from './notification.service';
import { User } from 'src/entities/user.entity';
import { Transaction } from 'src/entities/transactions.entity';

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
      transactionRepository: Repository<Transaction>;
    },
    private readonly notificationService: NotificationService,
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
    const posts = await this.repositories.postRepository.find({
      where: {
        status: 'visible',
        isReported: false,
        ...(search && { title: Like(`%${search}%`) }),
      },
      relations: ['variants', 'user'],
    });

    // Get userIds from posts (user donors)
    const userIds = posts.map((post) => post.user.id);

    // Get average review for each user donor
    const transactions = await this.repositories.transactionRepository.find({
      where: {
        userDonor: In(userIds),
        detail: Raw(
          (alias) =>
            `JSON_UNQUOTE(JSON_EXTRACT(${alias}, '$.review')) IS NOT NULL`,
        ),
      },
      relations: ['userDonor'],
    });

    const userReviewMap = transactions.reduce((map, transaction) => {
      const userId = transaction.userDonor.id;
      const review = transaction.detail.review;
      if (review !== null && review !== undefined) {
        if (!map[userId]) {
          map[userId] = { totalReview: 0, count: 0 };
        }
        map[userId].totalReview += review;
        map[userId].count += 1;
      }
      return map;
    }, {});

    for (const userId in userReviewMap) {
      userReviewMap[userId] =
        userReviewMap[userId].totalReview / userReviewMap[userId].count;
    }

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
          averageReview: userReviewMap[post.user.id] || null, // Add average review
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
      expiredAt: post.firstVariantExpiredAt,
      distance: post.distance,
      stok: post.stok,
      userId: post.userId,
      userName: post.userName,
      userProfilePicture: post.userProfilePicture,
      averageReview: post.averageReview,
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

  async findRecentPosts(lat: number, lon: number): Promise<any[]> {
    const now = new Date();

    // Get all posts with status 'visible' and 'isReported' false, sorted by 'createdAt' descending
    const posts = await this.repositories.postRepository.find({
      where: {
        status: 'visible',
        isReported: false,
      },
      relations: ['variants', 'user'],
      order: {
        createdAt: 'DESC', // Order by createdAt descending
      },
    });

    // Get userIds from posts (user donors)
    const userIds = posts.map((post) => post.user.id);

    // Get average review for each user donor
    const transactions = await this.repositories.transactionRepository.find({
      where: {
        userDonor: In(userIds),
        detail: Raw(
          (alias) =>
            `JSON_UNQUOTE(JSON_EXTRACT(${alias}, '$.review')) IS NOT NULL`,
        ),
      },
      relations: ['userDonor'],
    });

    const userReviewMap = transactions.reduce((map, transaction) => {
      const userId = transaction.userDonor.id;
      const review = transaction.detail.review;
      if (review !== null && review !== undefined) {
        if (!map[userId]) {
          map[userId] = { totalReview: 0, count: 0 };
        }
        map[userId].totalReview += review;
        map[userId].count += 1;
      }
      return map;
    }, {});

    for (const userId in userReviewMap) {
      userReviewMap[userId] =
        userReviewMap[userId].totalReview / userReviewMap[userId].count;
    }

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
          createdAt: `Diposting ${formatDistanceToNow(
            new Date(post.createdAt),
            {
              locale: id,
            },
          )} yang lalu`,
          updatedAt: `Diupdate ${formatDistanceToNow(new Date(post.updatedAt), {
            locale: id,
          })} yang lalu`,
          firstVariantExpiredAt: post.variants[0]
            ? `Kadaluwarsa dalam ${formatDistanceToNow(
                new Date(post.variants[0].expiredAt),
                { locale: id },
              )}`
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
          averageReview: userReviewMap[post.user.id] || null, // Add average review
        };
      })
      .filter((post) => post.distanceValue <= 10000); // Filter out posts beyond 10 km

    // Return formatted posts
    return postsWithDistance.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      expiredAt: post.firstVariantExpiredAt,
      distance: post.distance,
      stok: post.stok,
      userId: post.userId,
      userName: post.userName,
      userProfilePicture: post.userProfilePicture,
      averageReview: post.averageReview,
    }));
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

  async reportPost(
    postId: number,
    reporter: User,
    reason: string,
    transactionId?: number,
  ): Promise<Post> {
    const post = await this.repositories.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.isReported) {
      throw new BadRequestException('Post already reported');
    }

    post.isReported = true;
    await this.repositories.postRepository.save(post);

    // Buat notifikasi untuk user donor
    await this.notificationService.createNotification(
      post.user,
      'Postingan anda telah dilaporkan',
      `Alasan dilaporkan : "${reason}"`,
      reporter.name,
      transactionId,
    );

    return post;
  }
}
