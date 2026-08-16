import { Module } from '@nestjs/common';
import { CashfreeVerificationService } from './cashfree-verification.service';
import { VerificationController } from './verification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VerificationController],
  providers: [CashfreeVerificationService],
  exports: [CashfreeVerificationService],
})
export class VerificationModule {}
