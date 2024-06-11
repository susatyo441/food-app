import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../guard/auth.guard';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { Transaction } from '../entities/transactions.entity';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('create')
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req,
  ): Promise<Transaction> {
    const userId = req.user.id;
    return this.transactionService.create(createTransactionDto, userId);
  }
}
