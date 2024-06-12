import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transactions.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
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
    // Check if variant_id exists and jumlah does not exceed stok
    const variant = await this.variantRepository.findOne({
      where: { id: createTransactionDto.detail.variant_id },
    });

    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    // Check if the variant has expired
    if (variant.expiredAt && new Date(variant.expiredAt) < new Date()) {
      throw new BadRequestException(
        'Variant has expired and cannot be used for transactions',
      );
    }

    if (createTransactionDto.detail.jumlah > variant.stok) {
      throw new BadRequestException('Jumlah exceeds available stok');
    }

    // Get user_id_donor from post_id
    const post = await this.postRepository.findOne({
      where: { id: createTransactionDto.post_id },
      relations: ['user'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const user_id_donor = post.user.id;

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
      },
      timeline: {
        konfirmasi: new Date().toISOString(),
        pengambilan: null,
      },
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Reduce the stok from the variant
    variant.stok -= createTransactionDto.detail.jumlah;
    await this.variantRepository.save(variant);

    return savedTransaction;
  }
}
