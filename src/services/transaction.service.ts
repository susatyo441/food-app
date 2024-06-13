import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transactions.entity';
import {
  ConfirmPengambilanDto,
  CreateTransactionDto,
} from '../dto/create-transaction.dto';
import { Variant } from '../entities/variant.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    const now = new Date();

    // Get the post and its variants
    const post = await this.postRepository.findOne({
      where: { id: createTransactionDto.post_id },
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

    // Check if the variant belongs to the post
    const variant = post.variants.find(
      (v) => v.id === createTransactionDto.detail.variant_id,
    );

    if (!variant) {
      throw new BadRequestException('Variant not found in the specified post');
    }

    // Check if the variant has expired
    if (variant.expiredAt && new Date(variant.expiredAt) < now) {
      throw new BadRequestException(
        'Variant has expired and cannot be used for transactions',
      );
    }

    if (createTransactionDto.detail.jumlah > variant.stok) {
      throw new BadRequestException('Jumlah exceeds available stok');
    }

    // Calculate maks_pengambilan
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const maks_pengambilan =
      variant.expiredAt && new Date(variant.expiredAt) < twoHoursFromNow
        ? new Date(variant.expiredAt).toISOString()
        : twoHoursFromNow.toISOString();

    // Create transaction object
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      post,
      userDonor: { id: user_id_donor },
      userRecipient: { id: userId },
      detail: {
        ...createTransactionDto.detail,
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

    // Reduce the stok from the variant
    variant.stok -= createTransactionDto.detail.jumlah;
    await this.variantRepository.save(variant);

    return savedTransaction;
  }

  async confirmPengambilan(
    confirmPengambilanDto: ConfirmPengambilanDto,
    userId: number,
  ): Promise<Transaction> {
    const now = new Date();

    const transaction = await this.transactionRepository.findOne({
      where: { id: confirmPengambilanDto.transactionId },
      relations: ['userRecipient'],
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

    return await this.transactionRepository.save(transaction);
  }
}
