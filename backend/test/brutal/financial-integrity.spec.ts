jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: jest.fn(),
}));

import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from '../../src/payments/payments.service';
import { PropertiesBoostService } from '../../src/properties/boost/properties-boost.service';
import * as crypto from 'crypto';

describe('BRUTAL FINANCIAL SUITE 2: Payments & Financial Integrity', () => {
  describe('1. Cashfree Webhook Signature Security', () => {
    let paymentsService: PaymentsService;
    let mockPrisma: any;
    let mockConfigService: any;

    const MOCK_SECRET = 'cf_secret_key_testing_12345';

    beforeEach(() => {
      process.env.CASHFREE_PG_SECRET_KEY = MOCK_SECRET;
      process.env.CASHFREE_CLIENT_SECRET = MOCK_SECRET;
      mockPrisma = {
        $transaction: jest.fn(async (cb) => cb(mockPrisma)),
        payment: {
          findFirst: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        booking: {
          update: jest.fn(),
        },
      };
      paymentsService = new PaymentsService(
        mockPrisma,
        { sendNotification: jest.fn().mockResolvedValue({}) } as any,
      );
    });

    it('EXPLOIT ATTEMPT BLOCKED: Webhook with missing signature header MUST throw 401', async () => {
      const rawBody = Buffer.from(JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' }));
      const timestamp = Date.now().toString();

      await expect(
        paymentsService.handleCashfreeWebhook(
          { type: 'PAYMENT_SUCCESS_WEBHOOK' },
          rawBody,
          '', // Empty signature!
          timestamp,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('EXPLOIT ATTEMPT BLOCKED: Webhook with missing raw body MUST throw 401', async () => {
      const timestamp = Date.now().toString();
      const fakeSig = 'fake-hmac-signature';

      await expect(
        paymentsService.handleCashfreeWebhook(
          { type: 'PAYMENT_SUCCESS_WEBHOOK' },
          null as any, // Missing rawBody!
          fakeSig,
          timestamp,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('EXPLOIT ATTEMPT BLOCKED: Forged or tampered HMAC signature MUST throw 401', async () => {
      const rawBody = Buffer.from(JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', order: { order_id: 'SQ_123' } }));
      const timestamp = Date.now().toString();
      const forgedSig = 'TAMPERED_HMAC_SIGNATURE_ATTACK';

      await expect(
        paymentsService.handleCashfreeWebhook(
          { type: 'PAYMENT_SUCCESS_WEBHOOK' },
          rawBody,
          forgedSig,
          timestamp,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('VALID TRANSACTION VERIFIED: Legitimate HMAC signature matches and captures payment', async () => {
      const payloadObj = {
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: {
          order: {
            order_id: 'BOOKING_TEST_999',
            order_amount: 5000,
          },
          payment: {
            cf_payment_id: 'cf_pay_999',
            payment_status: 'SUCCESS',
            payment_amount: 5000,
            payment_currency: 'INR',
            payment_method: { upi: { channel: 'gpay' } },
          },
        },
      };

      const rawBodyString = JSON.stringify(payloadObj);
      const rawBody = Buffer.from(rawBodyString);
      const timestamp = (Date.now() / 1000).toFixed(0);

      // Generate legitimate Cashfree HMAC-SHA256 signature
      const signatureData = timestamp + rawBodyString;
      const validSignature = crypto
        .createHmac('sha256', MOCK_SECRET)
        .update(signatureData)
        .digest('base64');

      mockPrisma.payment.findFirst.mockResolvedValue({ id: 'PAY_1', bookingId: 'BOOKING_TEST_999' });
      mockPrisma.payment.update.mockResolvedValue({ id: 'PAY_1' });
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.booking.update.mockResolvedValue({ id: 'BOOKING_TEST_999', status: 'CONFIRMED' });

      const result = await paymentsService.handleCashfreeWebhook(
        payloadObj,
        rawBody,
        validSignature,
        timestamp,
      );

      expect(result).toBeDefined();
      expect(result.status.toLowerCase()).toBe('ok');
    });
  });

  describe('2. Property Boost Fake Activation Exploit Prevention', () => {
    let boostService: PropertiesBoostService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        property: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        propertyBoost: {
          create: jest.fn(),
        },
      };
      boostService = new PropertiesBoostService(mockPrisma, {} as any);
    });

    it('EXPLOIT BLOCKED: Activating boost without orderId MUST throw 400 Bad Request', async () => {
      const mockProperty = {
        id: 'prop-123',
        hostId: 'host-owner-id',
        title: 'Campers Paradise',
      };
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);

      const ownerUser = { id: 'host-owner-id', isAdmin: false };

      await expect(
        boostService.activateBoost('prop-123', 'BOOST_BASIC', ownerUser, {
          orderId: '', // Empty orderId attack!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('EXPLOIT BLOCKED: Non-owner host cannot activate boost on another host property', async () => {
      const mockProperty = {
        id: 'prop-123',
        hostId: 'legit-host-id',
      };
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);

      const attackerUser = { id: 'attacker-host-id', isAdmin: false };

      await expect(
        boostService.activateBoost('prop-123', 'BOOST_BASIC', attackerUser, {
          orderId: 'BOOST_VALID_ORDER_123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('EXPLOIT BLOCKED: Invalid boost tier parameter MUST throw 400 Bad Request', async () => {
      const mockProperty = {
        id: 'prop-123',
        hostId: 'host-owner-id',
      };
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);

      const ownerUser = { id: 'host-owner-id', isAdmin: false };

      await expect(
        boostService.activateBoost('prop-123', 'FREE_TIER_EXPLOIT', ownerUser, {
          orderId: 'ORDER_123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
