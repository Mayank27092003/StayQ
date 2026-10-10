import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EarningsModule } from '../earnings/earnings.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    EarningsModule,
    forwardRef(() => BookingsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
