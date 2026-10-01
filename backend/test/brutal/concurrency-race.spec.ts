jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: jest.fn(),
}));

import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingsService } from '../../src/bookings/bookings.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { AdminBookingsService } from '../../src/admin/bookings/admin-bookings.service';

describe('BRUTAL CONCURRENCY SUITE 3: Race Conditions & Concurrency Integrity', () => {
  describe('1. Atomic Double Booking Prevention', () => {
    let bookingsService: BookingsService;
    let availabilityDb: any[];
    let bookingsDb: any[];
    let mockPrisma: any;
    let mockCommissionService: any;
    let mockNotificationsService: any;

    beforeEach(() => {
      availabilityDb = [];
      bookingsDb = [];

      mockCommissionService = {
        getSettings: jest.fn().mockResolvedValue({
          guestServiceFeePercent: 10,
          gstRatePercent: 18,
        }),
      };

      const mockTicketGenerator = {
        generateTicketImage: jest.fn().mockResolvedValue(Buffer.from('fake-png')),
      };

      const mockNotificationsService = {
        sendRichPushNotification: jest.fn().mockResolvedValue(true),
        sendNotification: jest.fn().mockResolvedValue(true),
      };

      const mockEmailService = {
        sendBookingConfirmationEmail: jest.fn().mockResolvedValue(true),
      };

      const mockCloudTasks = {
        scheduleCheckInReminder: jest.fn().mockResolvedValue(true),
      };

      const mockLoyaltyService = {
        awardBookingPoints: jest.fn().mockResolvedValue(true),
      };

      mockPrisma = {
        property: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'PROP_RACE_1',
            title: 'Penthouse Goa',
            pricePerNight: 5000,
            cleaningFee: 500,
            hostId: 'HOST_1',
          }),
        },
        $transaction: jest.fn(async (callback) => {
          // Simulate transactional execution with an atomic mutex
          const tx = {
            availabilityBlock: {
              findFirst: jest.fn().mockImplementation(async (query: any) => {
                const { propertyId, AND } = query.where;
                const checkOut = AND[0].startDate.lt;
                const checkIn = AND[1].endDate.gt;

                return availabilityDb.find((b) =>
                  b.propertyId === propertyId &&
                  b.startDate < checkOut &&
                  b.endDate > checkIn
                );
              }),
              create: jest.fn().mockImplementation(async (args: any) => {
                availabilityDb.push(args.data);
                return args.data;
              }),
            },
            booking: {
              create: jest.fn().mockImplementation(async (args: any) => {
                const b = {
                  id: `BK_${bookingsDb.length + 1}`,
                  guest: {
                    id: args.data.guestId,
                    firebaseUid: `fb_${args.data.guestId}`,
                    email: 'guest@example.com',
                    displayName: 'Guest',
                  },
                  property: {
                    id: args.data.propertyId,
                    title: 'Penthouse Goa',
                    hostId: 'HOST_1',
                  },
                  ...args.data,
                };
                bookingsDb.push(b);
                return b;
              }),
            },
          };
          return await callback(tx);
        }),
      };

      bookingsService = new BookingsService(
        mockPrisma,
        mockCloudTasks as any,
        mockTicketGenerator as any,
        mockNotificationsService as any,
        mockEmailService as any,
        mockCommissionService as any,
        mockLoyaltyService as any,
      );
    });

    it('RACE CONDITION MITIGATED: 10 concurrent booking requests for same dates result in EXACTLY 1 booking', async () => {
      const checkIn = new Date('2026-11-01T12:00:00.000Z');
      const checkOut = new Date('2026-11-05T10:00:00.000Z');

      const requests = Array.from({ length: 10 }, (_, i) => ({
        propertyId: 'PROP_RACE_1',
        guestId: `GUEST_RACE_${i + 1}`,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        adults: 2,
        children: 0,
      }));

      // Fire 10 simultaneous requests
      const results = await Promise.allSettled(
        requests.map((req) => bookingsService.createBooking(req))
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE request must succeed
      expect(fulfilled).toHaveLength(1);
      // All other 9 requests must be rejected
      expect(rejected).toHaveLength(9);

      // Verify the rejections are due to date unavailability
      rejected.forEach((r: any) => {
        expect(r.reason).toBeInstanceOf(BadRequestException);
        expect(r.reason.message).toBe('Dates are not available');
      });

      // Verify DB state
      expect(availabilityDb).toHaveLength(1);
      expect(bookingsDb).toHaveLength(1);
    });
  });

  describe('2. Idempotent Payment Capture & Concurrency', () => {
    let paymentsService: PaymentsService;
    let paymentRecord: any;
    let mockPrisma: any;
    let mockNotifications: any;

    beforeEach(() => {
      paymentRecord = {
        id: 'PAY_RACE_100',
        razorpayOrderId: 'CF_ORDER_100',
        status: 'PENDING',
        bookingId: 'BK_100',
      };

      mockNotifications = {
        sendNotification: jest.fn().mockResolvedValue(true),
      };

      mockPrisma = {
        $transaction: jest.fn(async (cb) => {
          const tx = {
            payment: {
              findFirst: jest.fn().mockImplementation(async () => paymentRecord),
              update: jest.fn().mockImplementation(async ({ data }: any) => {
                Object.assign(paymentRecord, data);
                return paymentRecord;
              }),
            },
            booking: {
              update: jest.fn().mockResolvedValue({
                id: 'BK_100',
                guestId: 'GUEST_1',
                property: { title: 'Villa Sol', hostId: 'HOST_1' },
              }),
            },
          };
          return await cb(tx);
        }),
      };

      paymentsService = new PaymentsService(mockPrisma, mockNotifications);
    });

    it('IDEMPOTENCY VERIFIED: Concurrent webhook deliveries process payment once without duplicate notifications', async () => {
      // Fire 5 simultaneous webhook capture executions for the exact same order
      await Promise.all([
        paymentsService.markPaymentCaptured('CF_ORDER_100', 'ref_1'),
        paymentsService.markPaymentCaptured('CF_ORDER_100', 'ref_2'),
        paymentsService.markPaymentCaptured('CF_ORDER_100', 'ref_3'),
        paymentsService.markPaymentCaptured('CF_ORDER_100', 'ref_4'),
        paymentsService.markPaymentCaptured('CF_ORDER_100', 'ref_5'),
      ]);

      expect(paymentRecord.status).toBe('CAPTURED');
      // Guest notification sent exactly once, not 5 times
      expect(mockNotifications.sendNotification).toHaveBeenCalledTimes(2); // 1 to guest, 1 to host
    });
  });

  describe('3. Double Refund Prevention', () => {
    let adminBookingsService: AdminBookingsService;
    let mockPrisma: any;
    let mockRefundGateway: any;
    let refundsDb: any[];

    beforeEach(() => {
      refundsDb = [];

      mockRefundGateway = {
        isConfigured: jest.fn().mockReturnValue(true),
        refund: jest.fn().mockResolvedValue({
          gatewayRefundId: 'rfnd_gw_123',
          amount: 5000,
          status: 'processed',
        }),
      };

      const bookingMock = {
        id: 'BK_REFUND_1',
        payment: {
          id: 'PAY_REF_1',
          status: 'CAPTURED',
          amount: 5000,
          razorpayPaymentId: 'pay_rzp_123',
          refunds: refundsDb,
        },
      };

      mockPrisma = {
        booking: {
          findUnique: jest.fn().mockImplementation(async () => ({
            ...bookingMock,
            payment: {
              ...bookingMock.payment,
              refunds: [...refundsDb],
            },
          })),
        },
        $transaction: jest.fn(async (cb) => {
          const tx = {
            refund: {
              create: jest.fn().mockImplementation(async ({ data }: any) => {
                refundsDb.push(data);
                return { id: `REF_${refundsDb.length}`, ...data };
              }),
            },
            payment: {
              update: jest.fn(),
            },
          };
          return await cb(tx);
        }),
      };

      const mockAudit = {
        runWithAudit: jest.fn(async (mutation: any) => {
          return mockPrisma.$transaction(mutation);
        }),
      };

      adminBookingsService = new AdminBookingsService(
        mockPrisma,
        mockAudit as any,
        mockRefundGateway,
      );
    });

    it('REFUND DEFENSE: Second refund request on fully refunded payment is rejected with ConflictException', async () => {
      // First refund: returns 5000
      const firstResult = await adminBookingsService.refund(
        'BK_REFUND_1',
        { amount: 5000, reason: 'Guest cancellation' },
        'admin_user_1',
      );
      expect(firstResult).toBeDefined();

      // Second attempt to refund the same booking/payment
      await expect(
        adminBookingsService.refund(
          'BK_REFUND_1',
          { amount: 5000, reason: 'Duplicate attempt' },
          'admin_user_1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
