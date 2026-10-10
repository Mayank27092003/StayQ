import { PaymentsModule } from '../payments/payments.module';
import { DisputesModule } from '../disputes/disputes.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
@Module({
  imports: [
    PaymentsModule,
    DisputesModule,
    PrismaModule,
    BookingsModule,
    LoyaltyModule,
    WalletModule,
    NotificationsModule,
  ],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
