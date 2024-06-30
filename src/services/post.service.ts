import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { toZonedTime } from 'date-fns-tz';
import { In, Like, Repository, Raw, Between } from 'typeorm';
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
import { ExtendService } from './extend.service';
import { ConfigService } from '@nestjs/config';
import { roundToOneDecimal } from 'src/utils/rounding';

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
    private extendService: ExtendService,
    private readonly configService: ConfigService,
  ) {}

  private readonly maksimal_pengambilan = 3;
  async create(
    postData: CreatePostDto,
    userId: number,
    category: Category,
    urlPhotos: string[],
  ): Promise<Post> {
    // Buat objek Post
    const post = this.repositories.postRepository.create({
      ...postData,
      user: { id: userId },
    });

    // Simpan objek Post ke dalam database
    const savedPost = await this.repositories.postRepository.save(post);

    const categoryPost = this.repositories.categoryPostRepository.create({
      post: savedPost,
      category: category,
    });
    await this.repositories.categoryPostRepository.save(categoryPost);

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

  async getUserPost(userId: number): Promise<any[]> {
    const posts = await this.repositories.postRepository.find({
      where: {
        user: { id: userId },
        status: 'visible',
      },
      relations: ['variants', 'media'],
      order: { createdAt: 'DESC' },
    });
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      expiredAt: post.variants[0].expiredAt,
      isReported: post.isReported,
      stok: post.variants.reduce((total, variant) => total + variant.stok, 0),
      media: post.media,
    }));
  }

  async findPostsByLocation(
    lat: number,
    lon: number,
    search?: string,
  ): Promise<any[]> {
    const now = new Date();
    const nowZoned = toZonedTime(now, 'Asia/Jakarta');

    // Get all posts with status 'visible'
    const posts = await this.repositories.postRepository.find({
      where: {
        status: 'visible',
        isReported: false,
        ...(search && { title: Like(`%${search}%`) }),
      },
      relations: ['variants', 'user', 'media'],
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
          map[userId] = { totalReview: 0, count: 0, reviewCount: 0 };
        }
        map[userId].totalReview += review;
        map[userId].count += 1;
        map[userId].reviewCount += 1;
      }
      return map;
    }, {});

    for (const userId in userReviewMap) {
      userReviewMap[userId].averageReview = roundToOneDecimal(
        userReviewMap[userId].totalReview / userReviewMap[userId].count,
      );
    }

    // Filter out posts with expired variants or where all variants are out of stock
    const validPosts = posts.filter((post) => {
      const variantsAvailable = post.variants.some(
        (variant) =>
          variant.stok > 0 &&
          (!variant.expiredAt || new Date(variant.expiredAt) > nowZoned),
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
                toZonedTime(post.variants[0].expiredAt, 'Asia/Jakarta'),
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
          averageReview: userReviewMap[post.user.id]?.averageReview || null, // Add average review
          reviewCount: userReviewMap[post.user.id]?.reviewCount || 0, // Add review count
          media: post.media, // Add media
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
      reviewCount: post.reviewCount, // Include review count
      media: post.media,
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
    const nowZoned = toZonedTime(now, 'Asia/Jakarta');
    // Get all posts with status 'visible'
    const posts = await this.repositories.postRepository.find({
      where: {
        status: 'visible',
        isReported: false,
      },
      relations: ['variants', 'user', 'media'],
      order: { createdAt: 'DESC' },
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
          map[userId] = { totalReview: 0, count: 0, reviewCount: 0 };
        }
        map[userId].totalReview += review;
        map[userId].count += 1;
        map[userId].reviewCount += 1;
      }
      return map;
    }, {});

    for (const userId in userReviewMap) {
      userReviewMap[userId].averageReview = roundToOneDecimal(
        userReviewMap[userId].totalReview / userReviewMap[userId].count,
      );
    }

    // Filter out posts with expired variants or where all variants are out of stock
    const validPosts = posts.filter((post) => {
      const variantsAvailable = post.variants.some(
        (variant) =>
          variant.stok > 0 &&
          (!variant.expiredAt || new Date(variant.expiredAt) > nowZoned),
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
            ? `Kadaluwarsa dalam ${formatDistanceToNow(
                toZonedTime(post.variants[0].expiredAt, 'Asia/Jakarta'),
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
          averageReview: userReviewMap[post.user.id]?.averageReview || null, // Add average review
          reviewCount: userReviewMap[post.user.id]?.reviewCount || 0, // Add review count
          media: post.media, // Add media
        };
      })
      .filter((post) => post.distanceValue <= 10000); // Filter out posts beyond 10 km

    // Sort posts by distance
    postsWithDistance.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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
      reviewCount: post.reviewCount, // Include review count
      media: post.media,
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
    transactionId: number,
  ): Promise<Post> {
    const now = new Date();

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

    // If transactionId is provided, check if the reporter is the userRecipient of the transaction
    if (transactionId) {
      const transaction = await this.repositories.transactionRepository.findOne(
        {
          where: { id: transactionId },
          relations: ['userRecipient', 'post'],
        },
      );

      if (!transaction) {
        throw new BadRequestException('Transaction not found');
      }

      // Check if the postId matches the post_id in the transaction
      if (transaction.post.id != postId) {
        throw new BadRequestException(
          `Transaction does not belong to the specified post`,
        );
      }

      if (transaction.userRecipient.id !== reporter.id) {
        throw new UnauthorizedException(
          'You are not authorized to report this post',
        );
      }

      // Check if the transaction is ongoing
      if (
        !(
          !transaction.timeline?.pengambilan &&
          new Date(transaction.detail.maks_pengambilan) > now
        )
      ) {
        throw new BadRequestException(
          'Anda sedang tidak menjalankan transaksi ini saat ini.',
        );
      }

      // Update timeline.pengambilan to now
      if (!transaction.timeline) {
        transaction.timeline = {};
      }
      transaction.timeline.pengambilan = now.toISOString();

      // Save the updated transaction
      await this.repositories.transactionRepository.save(transaction);
    }

    post.isReported = true;
    await this.repositories.postRepository.save(post);

    // Create a notification for the user donor
    await this.notificationService.createNotification(
      post.user,
      'Postingan anda telah dilaporkan',
      `Alasan dilaporkan : "${reason}"`,
      reporter.name,
      transactionId,
    );

    return post;
  }

  async findPostById(
    idPost: number,
    lat: number,
    lon: number,
    userId: number,
  ): Promise<any> {
    const now = new Date();
    // Get the post by ID with its relations
    const post = await this.repositories.postRepository.findOne({
      where: { id: idPost, isReported: false },
      relations: [
        'variants',
        'user',
        'categoryPosts',
        'categoryPosts.category',
        'media', // Add media relation
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get userIds from the post (user donors)
    const userIdDonor = post.user.id;

    // Get average review for the user donor
    const transactions = await this.repositories.transactionRepository.find({
      where: {
        userDonor: post.user,
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
          map[userId] = { totalReview: 0, count: 0, reviewCount: 0 };
        }
        map[userId].totalReview += review;
        map[userId].count += 1;
        map[userId].reviewCount += 1;
      }
      return map;
    }, {});

    const averageReview = userReviewMap[userIdDonor]
      ? roundToOneDecimal(
          userReviewMap[userIdDonor].totalReview /
            userReviewMap[userIdDonor].count,
        )
      : null;

    const reviewCount = userReviewMap[userIdDonor]?.reviewCount || 0;

    // Calculate distance
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

    // Get ongoing transaction for this post and user
    const transactionsForUser =
      await this.repositories.transactionRepository.find({
        where: {
          userRecipient: { id: userId },
          post: { id: idPost },
        },
      });

    // Filter transactions to check for ongoing transactions
    const ongoingTransaction = transactionsForUser.find(
      (transaction) =>
        !transaction.timeline?.pengambilan &&
        new Date(transaction.detail.maks_pengambilan) > now,
    );

    // Get count of extends for the user
    const extendCount = await this.extendService.countValidExtends(userId);

    const max_pengambilan = this.maksimal_pengambilan + extendCount;

    // Get count of transactions for the user on the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count_pengambilan =
      await this.repositories.transactionRepository.count({
        where: {
          userRecipient: { id: userId },
          createdAt: Between(startOfDay, endOfDay),
        },
      });

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: `Diposting ${formatDistanceToNow(new Date(post.createdAt), {
        locale: id,
      })} yang lalu`,
      updatedAt: `Diupdate ${formatDistanceToNow(new Date(post.updatedAt), {
        locale: id,
      })} yang lalu`,
      expiredAt: post.variants[0]
        ? `Kadaluwarsa dalam ${formatDistanceToNow(
            toZonedTime(post.variants[0].expiredAt, 'Asia/Jakarta'),
            { locale: id },
          )}`
        : 'Tidak tersedia',
      distance: distanceText,
      stok: post.variants.reduce((total, variant) => total + variant.stok, 0),
      userName: post.user.name,
      userId: post.user.id,
      userProfilePicture: post.user.profile_picture,
      averageReview: averageReview,
      reviewCount: reviewCount, // Include review count
      categories: post.categoryPosts.map((cp) => cp.category.name),
      variants: post.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        stok: variant.stok,
      })),
      transaction: ongoingTransaction
        ? {
            id: ongoingTransaction.id,
            detail: ongoingTransaction.detail,
            timeline: ongoingTransaction.timeline,
          }
        : null,
      media: post.media.map((media) => ({
        id: media.id,
        url: media.url,
      })),
      max_pengambilan: max_pengambilan,
      sisa_pengambilan: max_pengambilan - count_pengambilan,
    };
  }

  async hidePost(postId: number): Promise<void> {
    const post = await this.repositories.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    post.status = 'hidden';
    await this.repositories.postRepository.save(post);
  }
}
