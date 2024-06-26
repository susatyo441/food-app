import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from '../entities/transactions.entity';
import {
  ConfirmPengambilanDto,
  CreateTransactionDto,
  GetTransactionsFilterDto,
  TransactionRole,
} from '../dto/create-transaction.dto';
import { Variant } from '../entities/variant.entity';
import { Post } from '../entities/post.entity';
import { NotificationService } from './notification.service';
import { User } from 'src/entities/user.entity';
import { FirebaseAdminService } from './firebase-admin.service';
import { ExtendService } from './extend.service';
import { PointService } from './point.service';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private extendService: ExtendService,
    private firebaseAdminService: FirebaseAdminService,
    private pointService: PointService,
  ) {}

  private readonly maksimal_pengambilan = 3;
  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number,
  ): Promise<any> {
    const now = new Date();
    const nowZoned = toZonedTime(now, 'Asia/Jakarta');
    // Check if the user has an ongoing transaction
    const transactions = await this.transactionRepository.find({
      where: {
        userRecipient: { id: userId },
      },
    });

    // Filter transactions to check for ongoing transactions
    const ongoingTransaction = transactions.find(
      (transaction) =>
        !transaction.timeline?.pengambilan &&
        new Date(transaction.detail.maks_pengambilan) > now,
    );

    if (ongoingTransaction) {
      throw new BadRequestException(
        'You have an ongoing transaction that has not been picked up yet',
      );
    }

    // Get the post and its variants
    const post = await this.postRepository.findOne({
      where: { id: createTransactionDto.post_id, isReported: false },
      relations: ['variants', 'user'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const user_id_donor = post.user.id;

    // Check if the user is the owner of the post
    if (user_id_donor === userId) {
      throw new BadRequestException(
        'You cannot make a transaction on your own post',
      );
    }

    // Check if the variants belong to the post
    const variants = createTransactionDto.detail.map((variantDetail) => {
      const variant = post.variants.find(
        (v) => v.id === variantDetail.variant_id,
      );
      if (!variant) {
        throw new BadRequestException(
          `Variant with id ${variantDetail.variant_id} not found in the specified post`,
        );
      }
      if (variant.expiredAt && new Date(variant.expiredAt) < nowZoned) {
        throw new BadRequestException(
          `Variant with id ${variantDetail.variant_id} has expired and cannot be used for transactions`,
        );
      }
      if (variantDetail.jumlah > variant.stok) {
        throw new BadRequestException(
          `Jumlah exceeds available stok for variant with id ${variantDetail.variant_id}`,
        );
      }
      return { variant, jumlah: variantDetail.jumlah };
    });

    // Calculate maks_pengambilan
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const maks_pengambilan = variants.reduce((latest, { variant }) => {
      const variantMaks =
        variant.expiredAt &&
        new Date(variant.expiredAt) <
          toZonedTime(twoHoursFromNow, 'Asia/Jakarta')
          ? new Date(variant.expiredAt).toISOString()
          : twoHoursFromNow.toISOString();
      return latest < variantMaks ? latest : variantMaks;
    }, twoHoursFromNow.toISOString());

    // Get the recipient user from the database
    const recipientUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!recipientUser) {
      throw new BadRequestException('Recipient user not found');
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const extendCount = await this.extendService.countValidExtends(userId);

    const max_pengambilan = this.maksimal_pengambilan + extendCount;
    const count_pengambilan = await this.transactionRepository.count({
      where: {
        userRecipient: { id: userId },
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    if (max_pengambilan <= count_pengambilan) {
      throw new BadRequestException(
        'Hari ini anda sudah mencapai maksimal pengambilan',
      );
    }

    // Create transaction object
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      post,
      userDonor: { id: user_id_donor },
      userRecipient: recipientUser,
      detail: {
        variant_id: createTransactionDto.detail.map((d) => d.variant_id),
        jumlah: createTransactionDto.detail.map((d) => d.jumlah),
        review: null, // Initialize review as null
        comment: null, // Initialize comment as null
        maks_pengambilan, // Add maks_pengambilan
      },
      timeline: {
        konfirmasi: now.toISOString(),
        pengambilan: null,
      },
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Reduce the stok from the variants
    for (const { variant, jumlah } of variants) {
      variant.stok -= jumlah;
      await this.variantRepository.save(variant);
    }

    const notification = await this.notificationService.createNotification(
      post.user,
      'Penerima baru untuk donasi Anda',
      `Seorang penerima telah mengkonfirmasi akan mengambil ${post.title} Anda dengan jumlah: ${createTransactionDto.detail
        .map((d) => {
          const variant = post.variants.find((v) => v.id === d.variant_id);
          return `${variant.name} - ${d.jumlah}`;
        })
        .join(', ')}.`,
      recipientUser.name,
      savedTransaction.id,
    );

    if (post.user.fcmToken) {
      const payload = {
        notification: {
          title: `Penerima baru untuk donasi Anda`,
          body: `Seorang penerima telah mengkonfirmasi akan mengambil ${post.title} Anda.`,
        },
        data: {
          id: notification.id.toString(),
          title: `Penerima baru untuk donasi Anda`,
          createdAt: notification.createdAt.toISOString(),
          isRead: notification.isRead.toString(),
          transaction_id: savedTransaction.id.toString() || '',
          name: recipientUser.name,
          message: `Seorang penerima telah mengkonfirmasi akan mengambil ${post.title} Anda`,
          type: 'donation',
        },
        token: post.user.fcmToken,
      };

      try {
        await this.firebaseAdminService.getMessaging().send(payload);
      } catch (error) {
        if (
          error.code === 'messaging/invalid-recipient' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          // Handle invalid token error
          console.log('Invalid FCM token:', error.message);
          return savedTransaction;
        } else {
          // Handle other errors
          console.log('FCM send error:', error.message);
          return savedTransaction;
        }
      }
    }

    return savedTransaction;
  }

  async confirmPengambilan(
    confirmPengambilanDto: ConfirmPengambilanDto,
    userId: number,
  ): Promise<any> {
    const now = new Date();

    const transaction = await this.transactionRepository.findOne({
      where: { id: confirmPengambilanDto.transactionId },
      relations: ['userRecipient', 'userDonor', 'post'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.timeline?.pengambilan) {
      throw new BadRequestException('Transaction has already been confirmed');
    }

    if (new Date(transaction.detail.maks_pengambilan) < now) {
      throw new BadRequestException('The pickup time has expired');
    }

    if (transaction.userRecipient.id !== userId) {
      throw new BadRequestException(
        'Only the recipient can confirm the pickup',
      );
    }

    if (!transaction.timeline) {
      transaction.timeline = {};
    }

    transaction.timeline.pengambilan = now.toISOString();
    transaction.detail.review = confirmPengambilanDto.review;
    transaction.detail.comment = confirmPengambilanDto.comment;

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Create notification for the donor
    const notification = await this.notificationService.createNotification(
      transaction.userDonor,
      'Pengambilan Dikonfirmasi',
      `Review: ${confirmPengambilanDto.review}/5, Comment: ${confirmPengambilanDto.comment}`,
      transaction.userRecipient.name,
      transaction.id,
    );
    await this.pointService.tambahPoint(
      transaction.userDonor,
      confirmPengambilanDto.review,
    );
    await this.pointService.tambahPoint(transaction.userRecipient, 2);
    if (transaction.userDonor.fcmToken) {
      const payload = {
        notification: {
          title: `Donasi anda telah diambil`,
          body: `Pengambilan donasi anda "${transaction.post.title}" telah diambil oleh ${transaction.userRecipient.name}.`,
        },
        data: {
          id: notification.id.toString(),
          title: `Donasi anda telah diambil`,
          createdAt: notification.createdAt.toISOString(),
          isRead: notification.isRead.toString(),
          transaction_id: transaction.id.toString() || '',
          name: transaction.userRecipient.name,
          message: `Pengambilan donasi anda "${transaction.post.title}" telah diambil oleh ${transaction.userRecipient.name}.`,
          type: 'donation',
        },
        token: transaction.userDonor.fcmToken,
      };
      const payloadPoint = {
        notification: {
          title: `Poin anda bertambah!`,
          body: `Selamat anda  mendapatkan tambahan ${confirmPengambilanDto.review} poin dari donasi yang telah Anda lakukan.`,
        },
        data: {
          type: 'donation',
        },
        token: transaction.userDonor.fcmToken,
      };
      try {
        await this.firebaseAdminService.getMessaging().send(payload);
        await this.firebaseAdminService.getMessaging().send(payloadPoint);
      } catch (error) {
        if (
          error.code === 'messaging/invalid-recipient' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          // Handle invalid token error
          console.log('Invalid FCM token:', error.message);
          return savedTransaction;
        } else {
          // Handle other errors
          console.log('FCM send error:', error.message);
          return savedTransaction;
        }
      }
    }
    if (transaction.userRecipient.fcmToken) {
      const payload = {
        notification: {
          title: `Poin anda bertambah!`,
          body: `Selamat anda  mendapatkan tambahan 2 poin dari konfirmasi pengambilan donasi yang telah Anda lakukan.`,
        },
        data: {
          type: 'donation',
        },
        token: transaction.userRecipient.fcmToken,
      };
      try {
        await this.firebaseAdminService.getMessaging().send(payload);
      } catch (error) {
        if (
          error.code === 'messaging/invalid-recipient' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          // Handle invalid token error
          console.log('Invalid FCM token:', error.message);
          return {
            savedTransaction,
          };
        } else {
          // Handle other errors
          console.log('FCM send error:', error.message);
          return {
            savedTransaction,
          };
        }
      }
    }

    return savedTransaction;
  }

  async cancelTransaction(transactionId: number, userId: number): Promise<any> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['userRecipient', 'userDonor', 'post'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.userRecipient.id !== userId) {
      throw new BadRequestException(
        'You are not authorized to cancel this transaction',
      );
    }

    const now = new Date();
    // Check if the transaction is still ongoing
    if (
      transaction.timeline?.pengambilan ||
      new Date(transaction.detail.maks_pengambilan) < now
    ) {
      throw new BadRequestException(
        'Transaction is not ongoing or has already expired',
      );
    }

    // Increase the stock of the variants
    for (let i = 0; i < transaction.detail.variant_id.length; i++) {
      const variantId = transaction.detail.variant_id[i];
      const jumlah = transaction.detail.jumlah[i];

      const variant = await this.variantRepository.findOne({
        where: { id: variantId },
      });

      if (variant) {
        variant.stok += jumlah;
        await this.variantRepository.save(variant);
      }
    }

    // Notify the user donor about the cancellation
    const notification = await this.notificationService.createNotification(
      transaction.userDonor,
      'Transaksi telah dibatalkan',
      `Transaksi Anda dengan judul "${transaction.post.title}" telah dibatalkan oleh penerima.`,
      transaction.userRecipient.name,
      transaction.id,
    );

    if (transaction.userDonor.fcmToken) {
      const payload = {
        notification: {
          title: `Transaksi telah dibatalkan`,
          body: `Transaksi Anda dengan judul "${transaction.post.title}" telah dibatalkan oleh ${transaction.userRecipient.name}.`,
        },
        data: {
          id: notification.id.toString(),
          title: `Transaksi telah dibatalkan`,
          createdAt: notification.createdAt.toISOString(),
          isRead: notification.isRead.toString(),
          transaction_id: transaction.id.toString() || '',
          name: transaction.userRecipient.name,
          message: `Transaksi Anda dengan judul "${transaction.post.title}" telah dibatalkan oleh ${transaction.userRecipient.name}.`,
          type: 'donation',
        },
        token: transaction.userDonor.fcmToken,
      };

      try {
        await this.firebaseAdminService.getMessaging().send(payload);
      } catch (error) {
        if (
          error.code === 'messaging/invalid-recipient' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          // Handle invalid token error
          console.log('Invalid FCM token:', error.message);
          return { success: false, error: 'Invalid FCM token' };
        } else {
          // Handle other errors
          console.log('FCM send error:', error.message);
          return { success: false, error: 'Failed to send notification' };
        }
      }
    }

    // Remove the transaction
    await this.transactionRepository.remove(transaction);

    return { message: 'Transaction has been successfully cancelled' };
  }

  async getUserTransactions(
    userId: number,
    filterDto: GetTransactionsFilterDto,
  ): Promise<any[]> {
    const { role } = filterDto;
    const now = new Date();

    let transactions: Transaction[];

    if (role === TransactionRole.DONOR) {
      transactions = await this.transactionRepository.find({
        where: { userDonor: { id: userId } },
        relations: [
          'post',
          'post.media',
          'post.variants',
          'userDonor',
          'userRecipient',
        ],
        order: {
          createdAt: 'DESC',
        },
      });
    } else if (role === TransactionRole.RECIPIENT) {
      transactions = await this.transactionRepository.find({
        where: { userRecipient: { id: userId } },
        relations: [
          'post',
          'post.media',
          'post.variants',
          'userDonor',
          'userRecipient',
        ],
        order: {
          createdAt: 'DESC',
        },
      });
    } else {
      transactions = await this.transactionRepository.find({
        where: [
          { userDonor: { id: userId } },
          { userRecipient: { id: userId } },
        ],
        relations: [
          'post',
          'post.media',
          'post.variants',
          'userDonor',
          'userRecipient',
        ],
        order: {
          createdAt: 'DESC',
        },
      });
    }

    return transactions.map((transaction) => {
      const variantDetails = transaction.detail.variant_id.map((id, index) => {
        const variant = transaction.post.variants.find((v) => v.id === id);
        return {
          variantId: id,
          variantName: variant ? variant.name : 'Unknown',
          jumlah: transaction.detail.jumlah[index],
        };
      });

      return {
        id: transaction.id,
        postId: transaction.post.id,
        postTitle: transaction.post.title,
        postMedia: transaction.post.media.map((media) => ({
          id: media.id,
          url: media.url,
        })),
        role: transaction.userDonor.id === userId ? 'donor' : 'recipient',
        status:
          !transaction.timeline?.pengambilan &&
          new Date(transaction.detail.maks_pengambilan) > now
            ? 'ongoing'
            : 'completed',
        detail: variantDetails,
        postBody: transaction.post.body,
        otherUserName:
          transaction.userDonor.id === userId
            ? transaction.userRecipient.name
            : transaction.userDonor.name,
        otherUserId:
          transaction.userDonor.id === userId
            ? transaction.userRecipient.id
            : transaction.userDonor.id,
        review: transaction.detail.review ?? null, // Add review
        timeline: transaction.timeline,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    });
  }

  async getTransactionDetail(id: number, userId: number) {
    const userDonor = await this.userRepository.findOne({
      where: { id: userId },
    });
    const transaction = await this.transactionRepository.findOne({
      where: { id, userDonor },
      relations: ['userRecipient', 'post', 'post.variants'], // Load relasi yang diperlukan
    });

    if (!transaction) {
      return null; // Transaksi tidak ditemukan
    }

    const variantsWithJumlah = transaction.post.variants
      .filter((variant) => transaction.detail.variant_id.includes(variant.id)) // Filter varian berdasarkan variant_id
      .map((variant) => ({
        name: variant.name,
        jumlah:
          transaction.detail.jumlah[
            transaction.detail.variant_id.indexOf(variant.id)
          ],
      }));

    return {
      transaction_id: transaction.id,
      user_recipient_id: transaction.userRecipient.id,
      user_recipient_profile_picture: transaction.userRecipient.profile_picture,
      user_recipient_name: transaction.userRecipient.name,
      transaction_timeline: transaction.timeline,
      variant: variantsWithJumlah,
      post_title: transaction.post.title,
      post_alamat: transaction.post.body.alamat,
      post_coordinate: transaction.post.body.coordinate,
      post_id: transaction.post.id,
      rating: transaction.detail.review,
      comment: transaction.detail.comment,
    };
  }

  async getTransactionDetailRecipient(id: number, userId: number) {
    const userRecipient = await this.userRepository.findOne({
      where: { id: userId },
    });
    const transaction = await this.transactionRepository.findOne({
      where: { id, userRecipient },
      relations: ['userDonor', 'post', 'post.variants'], // Load relasi yang diperlukan
    });

    if (!transaction) {
      return null; // Transaksi tidak ditemukan
    }

    const variantsWithJumlah = transaction.post.variants
      .filter((variant) => transaction.detail.variant_id.includes(variant.id)) // Filter varian berdasarkan variant_id
      .map((variant) => ({
        name: variant.name,
        jumlah:
          transaction.detail.jumlah[
            transaction.detail.variant_id.indexOf(variant.id)
          ],
      }));

    return {
      transaction_id: transaction.id,
      user_donor_id: transaction.userDonor.id,
      user_donor_profile_picture: transaction.userDonor.profile_picture,
      user_donor_name: transaction.userDonor.name,
      transaction_timeline: transaction.timeline,
      variant: variantsWithJumlah,
      post_title: transaction.post.title,
      post_alamat: transaction.post.body.alamat,
      post_coordinate: transaction.post.body.coordinate,
      rating: transaction.detail.review,
      comment: transaction.detail.comment,
      post_id: transaction.post.id,
    };
  }

  async getReviewsByUserDonor(userId: number, rating?: number): Promise<any[]> {
    const transactions = await this.transactionRepository.find({
      where: { userDonor: { id: userId } },
      relations: ['userDonor', 'userRecipient', 'post', 'post.variants'],
      order: {
        createdAt: 'DESC',
      },
    });

    const filteredTransactions = transactions.filter(
      (transaction) =>
        transaction.detail.review !== undefined &&
        transaction.detail.review !== null &&
        (rating === undefined || transaction.detail.review == rating),
    );

    return filteredTransactions.map((transaction) => ({
      userRecipientName: transaction.userRecipient.name,
      userRecipientProfilePicture: transaction.userRecipient.profile_picture,
      comment: transaction.detail.comment || '',
      review: transaction.detail.review || 0,
      createdAt: transaction.createdAt,
      postTitle: transaction.post.title,
      variants: transaction.detail.variant_id.map((variantId, index) => {
        const variant = transaction.post.variants.find(
          (v) => v.id === variantId,
        );
        return {
          name: variant ? variant.name : 'Unknown',
          jumlahAmbil: transaction.detail.jumlah[index],
        };
      }),
    }));
  }

  async getReviewCountsByRating(userId: number): Promise<any> {
    const transactions = await this.transactionRepository.find({
      where: { userDonor: { id: userId } },
      relations: ['userDonor', 'userRecipient', 'post', 'post.variants'],
    });

    const reviewCounts = [1, 2, 3, 4, 5].reduce((acc, rating) => {
      acc[rating] = transactions.filter(
        (transaction) => transaction.detail.review === rating,
      ).length;
      return acc;
    }, {});

    return reviewCounts;
  }

  async getOngoingTransactions(userId: number): Promise<any[]> {
    const now = new Date().toISOString();

    const donorTransactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.userDonor', 'userDonor')
      .leftJoinAndSelect('transaction.userRecipient', 'userRecipient')
      .leftJoinAndSelect('transaction.post', 'post')
      .where('transaction.userDonor.id = :userId', { userId })
      .getMany();

    const recipientTransactions = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.userDonor', 'userDonor')
      .leftJoinAndSelect('transaction.userRecipient', 'userRecipient')
      .leftJoinAndSelect('transaction.post', 'post')
      .where('transaction.userRecipient.id = :userId', { userId })
      .getMany();

    // Filter transactions based on `maks_pengambilan` and `pengambilan`
    const filterTransactions = (transactions) => {
      return transactions.filter((transaction) => {
        const maksPengambilan = new Date(
          transaction.detail.maks_pengambilan,
        ).toISOString();
        const pengambilan = transaction.timeline?.pengambilan;
        return !pengambilan && maksPengambilan > now;
      });
    };

    const filteredDonorTransactions = filterTransactions(donorTransactions);
    const filteredRecipientTransactions = filterTransactions(
      recipientTransactions,
    );

    const transactions = [
      ...filteredDonorTransactions,
      ...filteredRecipientTransactions,
    ];

    return transactions.map((transaction) => {
      let role, user;

      if (transaction.userDonor.id === userId) {
        role = 'donor';
        user = transaction.userRecipient;
      } else {
        role = 'recipient';
        user = transaction.userDonor;
      }

      return {
        transactionId: transaction.id,
        postId: transaction.post.id,
        postTitle: transaction.post.title,
        userId: user.id,
        userName: user.name,
        role,
      };
    });
  }

  async getCompletedTransactionDetail(
    transactionId: number,
    userId: number,
  ): Promise<any> {
    const now = new Date();

    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: [
        'userDonor',
        'userRecipient',
        'post',
        'post.media',
        'post.variants',
      ],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const status =
      !transaction.timeline?.pengambilan &&
      new Date(transaction.detail.maks_pengambilan) > now
        ? 'ongoing'
        : 'completed';

    if (status !== 'completed') {
      throw new NotFoundException('Transaction is not completed');
    }

    const isUserDonor = transaction.userDonor.id === userId;
    const otherUser = isUserDonor
      ? transaction.userRecipient
      : transaction.userDonor;

    return {
      postTitle: transaction.post.title,
      variants: transaction.detail.variant_id.map((variantId, index) => {
        const variant = transaction.post.variants.find(
          (v) => v.id === variantId,
        );
        return {
          name: variant ? variant.name : 'Unknown',
          jumlahAmbil: transaction.detail.jumlah[index],
        };
      }),
      timeline: transaction.timeline,
      review: transaction.detail.review || null,
      comment: transaction.detail.comment || '',
      userName: otherUser.name,
      userId: otherUser.id,
      role: isUserDonor ? 'Donatur' : 'Penerima',
      userProfilePicture: otherUser.profile_picture,
      postMedia: transaction.post.media.map((media) => ({
        id: media.id,
        url: media.url,
      })),
    };
  }
}
