import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionModule } from '../commission/commission.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { EarningsModule } from '../earnings/earnings.module';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    CommissionModule,
    LoyaltyModule,
    EarningsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => WalletModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
