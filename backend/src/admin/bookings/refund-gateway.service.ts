import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GatewayRefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;
}

/**
 * Thin wrapper over the Razorpay refund API.
 *
 * This performs a real provider call. It deliberately has no simulated success
 * path: if credentials are missing, or the SDK rejects the request, the caller
 * receives an error and no refund row is written. Recording a refund that never
 * reached the provider would misreport money as returned.
 */
@Injectable()
export class RefundGatewayService {
  private readonly logger = new Logger(RefundGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('RAZORPAY_KEY_ID') &&
        this.config.get<string>('RAZORPAY_KEY_SECRET'),
    );
  }

  /**
   * Issues a refund against a captured Razorpay payment.
   *
   * @param gatewayPaymentId Provider payment id (`Payment.razorpayPaymentId`).
   * @param amount Amount in major currency units; converted to paise.
   */
  async refund(
    gatewayPaymentId: string,
    amount: number,
    notes: Record<string, string>,
  ): Promise<GatewayRefundResult> {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException(
        'Refunds are unavailable: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured on the API.',
      );
    }

    // Required lazily so a missing/native-dependency issue in the SDK cannot
    // prevent the rest of the admin API from booting.
    let Razorpay: new (options: { key_id: string; key_secret: string }) => {
      payments: {
        refund: (
          paymentId: string,
          payload: Record<string, unknown>,
        ) => Promise<{ id: string; amount: number; status: string }>;
      };
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Razorpay = require('razorpay');
    } catch (error) {
      this.logger.error('Razorpay SDK could not be loaded', error as Error);
      throw new ServiceUnavailableException(
        'Refunds are unavailable: the Razorpay SDK is not installed on the API.',
      );
    }

    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

    try {
      const response = await client.payments.refund(gatewayPaymentId, {
        // Razorpay expects the smallest currency unit.
        amount: Math.round(amount * 100),
        speed: 'normal',
        notes,
      });

      return {
        gatewayRefundId: response.id,
        amount: response.amount / 100,
        status: response.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown gateway error';
      this.logger.error(`Razorpay refund failed for payment ${gatewayPaymentId}: ${message}`);
      throw new ServiceUnavailableException(`The payment gateway rejected the refund: ${message}`);
    }
  }
}
