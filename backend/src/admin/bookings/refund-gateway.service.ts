import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../../payments/payments.service';
export interface GatewayRefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;
}
@Injectable()
export class RefundGatewayService {
  constructor(
    private config: ConfigService,
    private payments: PaymentsService,
  ) {}
  isConfigured() {
    return !!(
      (this.config.get('CASHFREE_PG_APP_ID') ||
        this.config.get('CASHFREE_CLIENT_ID')) &&
      (this.config.get('CASHFREE_PG_SECRET_KEY') ||
        this.config.get('CASHFREE_CLIENT_SECRET'))
    );
  }
  async refund(
    paymentId: string,
    amount: number,
    notes: Record<string, string>,
  ): Promise<GatewayRefundResult> {
    if (!notes.orderId || !notes.refundId)
      throw new BadRequestException(
        'Persisted order and refund identifiers are required',
      );
    const r = await this.payments.initiateRefund({
      orderId: notes.orderId,
      refundAmount: amount,
      refundId: notes.refundId,
      refundNote: notes.reason,
    });
    return { gatewayRefundId: r.refundId, amount, status: r.status };
  }
}
