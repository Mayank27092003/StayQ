import { Public } from '../common/decorators/public.decorator';
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * 1. CREATE PAYMENT ORDER (Cashfree PG)
   * Returns orderId + paymentSessionId for web and mobile checkout.
   */
  @Post('create-order')
  @UseGuards(FirebaseAuthGuard)
  async createOrder(
    @CurrentUser() user: User,
    @Body()
    body: {
      bookingId?: string;
      amount?: number;
      returnUrl?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
    },
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    let validatedAmount: number | undefined;
    if (body.amount !== undefined) {
      const parsed = Number(body.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new BadRequestException(
          'Payment amount must be a positive number',
        );
      }
      validatedAmount = parsed;
    }

    return this.paymentsService.createCashfreeOrder({
      bookingId: body.bookingId,
      amount: validatedAmount ?? 0,
      idempotencyKey,
      authenticatedUser: user,
      customerId: user.id,
      customerName: body.customerName || user.displayName || undefined,
      customerEmail: body.customerEmail || user.email || undefined,
      customerPhone: body.customerPhone || user.phone || undefined,
      returnUrl: body.returnUrl,
    });
  }

  /**
   * Test Order Creation (Strictly Admin Protected)
   */
  @Post('test-order')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  async createTestOrder() {
    throw new BadRequestException(
      'Use a real sandbox booking to test checkout',
    );
  }

  /**
   * 2. VERIFY PAYMENT STATUS
   */
  @Get('verify/:orderId')
  @UseGuards(FirebaseAuthGuard)
  verifyPayment(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    return this.paymentsService.verifyPayment(orderId, user);
  }

  /**
   * 3. CASHFREE WEBHOOK LISTENER
   */
  @Public()
  @Post('webhook/cashfree')
  async handleCashfreeWebhook(
    @Req() req: any,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
  ) {
    const rawBody = req.rawBody;
    const event = req.body;
    return this.paymentsService.handleCashfreeWebhook(
      event,
      rawBody,
      signature,
      timestamp,
    );
  }

  /**
   * 4. INITIATE REFUND
   */
  @Post('refund')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  async initiateRefund(
    @CurrentUser('id') actorId: string,
    @Body()
    body: {
      orderId: string;
      refundAmount: number;
      refundReason?: string;
    },
  ) {
    return this.paymentsService.initiateRefund({
      orderId: body.orderId,
      refundAmount: body.refundAmount,
      refundNote: body.refundReason,
      actorId,
    });
  }

  /**
   * 5. LEGACY WEBHOOK COMPATIBILITY
   */
  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    const event = req.body;
    return this.paymentsService.handleWebhook(event, rawBody, signature);
  }
}
