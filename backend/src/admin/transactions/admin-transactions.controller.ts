import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminTransactionsService } from './admin-transactions.service';

@ApiTags('Admin / Transactions & Premiums')
@ApiBearerAuth()
@Controller('admin/transactions')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminTransactionsController {
  constructor(private readonly transactionsService: AdminTransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List transactions, Host Pro subscriptions, and boosts with expiry dates and customer details',
  })
  async getTransactions(
    @Query('purpose') purpose?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.getTransactions({
      purpose,
      status,
      search,
      page,
      limit,
    });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get revenue KPIs, Host Pro MRR, boost volume, and commission breakdown',
  })
  async getStats() {
    return this.transactionsService.getTransactionStats();
  }

  @Get(':orderId')
  @ApiOperation({
    summary: 'Get single transaction receipt, customer dossier, and gateway payment trace',
  })
  async getTransactionDetail(@Param('orderId') orderId: string) {
    return this.transactionsService.getTransactionDetail(orderId);
  }
}
