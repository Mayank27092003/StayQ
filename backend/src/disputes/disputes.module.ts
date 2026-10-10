import { Module, forwardRef } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EarningsModule } from '../earnings/earnings.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, EarningsModule, forwardRef(() => PaymentsModule)],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
