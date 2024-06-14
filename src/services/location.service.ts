import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transactions.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async validateOngoingTransaction(
    transactionId: number,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['userDonor', 'userRecipient'],
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    const now = new Date();
    if (
      transaction.timeline?.pengambilan ||
      new Date(transaction.detail.maks_pengambilan) < now
    ) {
      throw new BadRequestException(
        'Transaction is not ongoing or has already expired',
      );
    }

    return transaction;
  }

  async updateLocation(
    transactionId: number,
    lat: number,
    lon: number,
    userId: number,
  ): Promise<void> {
    const transaction = await this.validateOngoingTransaction(transactionId);
    if (transaction.userRecipient.id != userId) {
      throw new BadRequestException(
        `You are not authorized to view the location for this transaction`,
      );
    }

    transaction.detail.recipientLocation = { lat, lon };
    await this.transactionRepository.save(transaction);
  }

  async getRecipientLocation(
    transactionId: number,
    userId: number,
  ): Promise<{ lat: number; lon: number }> {
    const transaction = await this.validateOngoingTransaction(transactionId);
    if (transaction.userDonor.id != userId) {
      throw new BadRequestException(
        'You are not authorized to view the location for this transaction',
      );
    }

    return transaction.detail.recipientLocation;
  }
}
