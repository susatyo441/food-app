import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '../guard/auth.guard';
import { TransactionService } from '../services/transaction.service';
import {
  ConfirmPengambilanDto,
  CreateTransactionDto,
  GetTransactionsFilterDto,
} from '../dto/create-transaction.dto';
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

  @Post('confirm-pengambilan')
  async confirmPengambilan(
    @Body() confirmPengambilanDto: ConfirmPengambilanDto,
    @Req() req,
  ): Promise<Transaction> {
    const userId = req.user.id;
    return this.transactionService.confirmPengambilan(
      confirmPengambilanDto,
      userId,
    );
  }

  @Delete('cancel/:transactionId')
  async cancelTransaction(
    @Param('transactionId') transactionId: number,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.transactionService.cancelTransaction(transactionId, userId);
  }

  @Get()
  async getUserTransactions(
    @Req() req,
    @Query() filterDto: GetTransactionsFilterDto,
  ): Promise<any[]> {
    return this.transactionService.getUserTransactions(req.user.id, filterDto);
  }

  @Get('donor/:id')
  async getTransactionDetail(@Param('id') id: number, @Req() req) {
    const transactionDetail =
      await this.transactionService.getTransactionDetail(id, req.user.id);
    if (!transactionDetail) {
      // Handle jika transaksi tidak ditemukan
      throw new NotFoundException('Transaction not found');
    }
    return transactionDetail;
  }

  @Get('reviews')
  async getReviewsByUserDonor(
    @Query('rating') rating?: number,
    @Query('userId') userId?: number,
  ) {
    return this.transactionService.getReviewsByUserDonor(userId, rating);
  }

  @Get('review-counts')
  async getReviewCountsByRating(@Query('userId') userId?: number) {
    return this.transactionService.getReviewCountsByRating(userId);
  }

  @Get('ongoing')
  async getOngoingTransactions(@Req() req) {
    return this.transactionService.getOngoingTransactions(req.user.id);
  }
}
