import { Controller, Post, Get, Body, Headers, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
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
  async createOrder(
    @Body() body: {
      bookingId?: string;
      amount: number;
      returnUrl?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      customerId?: string;
    },
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.paymentsService.createCashfreeOrder({
      bookingId: body.bookingId || `booking_${Date.now()}`,
      amount: body.amount,
      idempotencyKey,
      customerId: body.customerId || `cust_${Date.now()}`,
      customerName: body.customerName || 'Stay Q Guest',
      customerEmail: body.customerEmail || 'guest@stayq.space',
      customerPhone: body.customerPhone || '9876543210',
      returnUrl: body.returnUrl,
    });
  }

  /**
   * Test Order Creation (Direct / Admin)
   */
  @Post('test-order')
  async createTestOrder(
    @Body() body: {
      amount: number;
      bookingId?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
    },
  ) {
    return this.paymentsService.createCashfreeOrder({
      bookingId: body.bookingId || `test_booking_${Date.now()}`,
      amount: body.amount || 1.00,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
    });
  }

  /**
   * 2. VERIFY PAYMENT STATUS
   */
  @Get('verify/:orderId')
  async verifyPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.verifyPayment(orderId);
  }

  /**
   * 3. CASHFREE WEBHOOK LISTENER
   */
  @Post('webhook/cashfree')
  async handleCashfreeWebhook(
    @Req() req: any,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
  ) {
    const rawBody = req.rawBody;
    const event = req.body;
    return this.paymentsService.handleCashfreeWebhook(event, rawBody, signature, timestamp);
  }

  /**
   * 4. INITIATE REFUND
   */
  @Post('refund')
  @UseGuards(FirebaseAuthGuard)
  async initiateRefund(
    @Body() body: {
      orderId: string;
      refundAmount: number;
      refundReason?: string;
    },
  ) {
    return this.paymentsService.initiateRefund({
      orderId: body.orderId,
      refundAmount: body.refundAmount,
      refundNote: body.refundReason,
    });
  }

  /**
   * 5. LEGACY WEBHOOK COMPATIBILITY
   */
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
