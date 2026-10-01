import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionModule } from '../commission/commission.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    CommissionModule,
    LoyaltyModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
