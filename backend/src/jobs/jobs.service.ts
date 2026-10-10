import { getStorage } from 'firebase-admin/storage';
import { PaymentsService } from '../payments/payments.service';
import { DisputesService } from '../disputes/disputes.service';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private payments: PaymentsService,
    private disputes: DisputesService,
    private prisma: PrismaService,
    private bookings: BookingsService,
    private loyalty: LoyaltyService,
    private wallet: WalletService,
    private notifications: NotificationsService,
  ) {}
  onModuleInit() {
    if (process.env.JOBS_ENABLED === 'true') {
      this.timer = setInterval(
        () =>
          void this.run().catch(() =>
            this.logger.error('Job worker iteration failed'),
          ),
        15000,
      );
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async run() {
    if (this.running) return { processed: 0 };
    this.running = true;
    let processed = 0;
    try {
      await this.bookings.cleanupExpiredHolds();
      for (let i = 0; i < 25; i++) {
        const job = await this.prisma.$transaction(async (tx) => {
          const rows: { id: string }[] =
            await tx.$queryRaw`SELECT id FROM "DomainJob" WHERE "completedAt" IS NULL AND "availableAt"<=NOW() AND ("lockedUntil" IS NULL OR "lockedUntil"<NOW()) ORDER BY "availableAt", id LIMIT 1 FOR UPDATE SKIP LOCKED`;
          if (!rows.length) return null;
          return tx.domainJob.update({
            where: { id: rows[0].id },
            data: {
              lockedUntil: new Date(Date.now() + 120000),
              attempts: { increment: 1 },
            },
          });
        });
        if (!job) break;
        try {
          if (job.type === 'REFUND_RECONCILE') {
            const refund = await this.prisma.refund.findUnique({
              where: { id: job.referenceId },
              include: { payment: true },
            });
            if (refund?.status === 'PENDING') {
              if (!refund.payment.razorpayOrderId || !refund.razorpayRefundId)
                throw new Error(
                  'Refund provider references require reconciliation',
                );
              const result = await this.payments.initiateRefund({
                orderId: refund.payment.razorpayOrderId,
                refundId: refund.razorpayRefundId,
                refundAmount: Number(refund.amount),
                refundNote: refund.reason || undefined,
              });
              if (result.status === 'PENDING')
                throw new Error('Provider refund remains pending');
            }
          } else if (job.type === 'IDENTITY_DELETE') {
            const user = await this.prisma.user.findUnique({
              where: { id: job.referenceId },
            });
            if (user?.deletedAt) {
              try {
                await getAuth().deleteUser(user.firebaseUid);
              } catch (e: any) {
                if (e.code !== 'auth/user-not-found') throw e;
              }
              const bucket = process.env.FIREBASE_STORAGE_BUCKET;
              if (!bucket)
                throw new Error(
                  'Storage bucket required for account file cleanup',
                );
              await getStorage()
                .bucket(bucket)
                .deleteFiles({
                  prefix: `users/${user.firebaseUid}/`,
                  force: true,
                });
              await this.prisma.user.update({
                where: { id: user.id },
                data: { identityDeletionPending: false },
              });
            }
          } else if (job.type === 'BROADCAST_MESSAGE') {
            const [broadcastId, userId] = job.referenceId.split(':');
            const broadcast = await this.prisma.broadcast.findUniqueOrThrow({
              where: { id: broadcastId },
            });
            const delivered = await this.notifications.sendNotification(
              userId,
              'PROMOTION',
              broadcast.title,
              broadcast.body,
              { broadcastId, eventKey: job.key },
            );
            await this.prisma.$transaction(async (tx) => {
              await tx.$queryRaw`SELECT id FROM "Broadcast" WHERE id=${broadcastId} FOR UPDATE`;
              await tx.domainJob.update({
                where: { id: job.id },
                data: {
                  completedAt: new Date(),
                  lockedUntil: null,
                  lastError: null,
                  result: { notificationCreated: Boolean(delivered) },
                },
              });
              const completed = await tx.domainJob.findMany({
                where: {
                  type: 'BROADCAST_MESSAGE',
                  key: { startsWith: `broadcast:${broadcastId}:` },
                  completedAt: { not: null },
                },
                select: { result: true },
              });
              const deliveredCount = completed.filter(
                (j) => (j.result as any)?.notificationCreated === true,
              ).length;
              const done = completed.length === broadcast.recipientCount;
              await tx.broadcast.update({
                where: { id: broadcastId },
                data: {
                  deliveredCount,
                  failedCount: completed.length - deliveredCount,
                  ...(done ? { status: 'SENT', sentAt: new Date() } : {}),
                },
              });
            });
          } else if (job.type === 'DISPUTE_RESOLUTION') {
            await this.disputes.processResolution(job.referenceId);
          } else if (job.type === 'MESSAGE_NOTIFICATION') {
            const m = await this.prisma.message.findUnique({
              where: { id: job.referenceId },
              include: { conversation: true, sender: true },
            });
            if (m) {
              const recipient =
                m.conversation.guestId === m.senderId
                  ? m.conversation.hostId
                  : m.conversation.guestId;
              await this.notifications.sendNotification(
                recipient,
                'NEW_MESSAGE',
                m.sender.displayName || 'New message',
                m.text?.slice(0, 80) || 'Sent an attachment',
                {
                  conversationId: m.conversationId,
                  messageId: m.id,
                  eventKey: 'message:' + m.id,
                },
              );
            }
          } else if (job.type === 'REVIEW_REVERSAL') {
            const r = await this.prisma.review.findUnique({
              where: { id: job.referenceId },
            });
            if (r?.moderationStatus !== 'APPROVED' && r)
              await this.loyalty.reverseReviewPoints(r.guestId, r.id);
          } else if (job.type === 'REVIEW_REWARD') {
            const r = await this.prisma.review.findUnique({
              where: { id: job.referenceId },
            });
            if (r?.moderationStatus === 'APPROVED')
              await this.loyalty.awardReviewPoints(r.guestId, r.id);
          } else {
            if (
              ![
                'BOOKING_CONFIRMED',
                'BOOKING_REQUEST',
                'BOOKING_CANCELLED',
                'LATE_REFUND',
                'BOOKING_COMPLETED',
                'BOOKING_REMINDER',
              ].includes(job.type)
            )
              throw new Error('Unknown job type');
            const b = await this.prisma.booking.findUnique({
              where: { id: job.referenceId },
              include: {
                property: { include: { host: true, images: true } },
                guest: true,
                payment: true,
              },
            });
            if (b) {
              if (job.type === 'BOOKING_CONFIRMED') {
                await this.bookings.dispatchBookingConfirmedSideEffects(b);
                if (b.status === 'CONFIRMED')
                  await this.prisma.domainJob.upsert({
                    where: { key: `reminder:${b.id}` },
                    create: {
                      key: `reminder:${b.id}`,
                      type: 'BOOKING_REMINDER',
                      referenceId: b.id,
                      availableAt: new Date(
                        Math.max(Date.now(), b.checkIn.getTime() - 86400000),
                      ),
                    },
                    update: {},
                  });
              } else if (
                job.type === 'BOOKING_REQUEST' &&
                b.status === 'PENDING_HOST_APPROVAL'
              ) {
                await this.notifications.sendNotification(
                  b.property.hostId,
                  'BOOKING_REQUEST',
                  'Booking request',
                  'A paid reservation awaits your decision',
                  { bookingId: b.id, eventKey: `request:${b.id}:host` },
                );
                await this.notifications.sendNotification(
                  b.guestId,
                  'PAYMENT_CAPTURED',
                  'Payment received',
                  'Your reservation awaits host approval',
                  { bookingId: b.id, eventKey: `request:${b.id}:guest` },
                );
              } else if (
                job.type === 'BOOKING_CANCELLED' ||
                job.type === 'LATE_REFUND'
              )
                await this.bookings.processCancellation(
                  b,
                  job.type === 'LATE_REFUND',
                );
              else if (job.type === 'BOOKING_COMPLETED') {
                await this.loyalty.awardBookingPoints(
                  b.guestId,
                  b.id,
                  Number(b.totalAmount),
                );
                await this.loyalty.awardRepeatStayPoints(
                  b.guestId,
                  b.id,
                  b.property.title,
                );
                const referral = await this.prisma.referral.findUnique({
                  where: { referredUserId: b.guestId },
                });
                if (referral)
                  await this.wallet.processReferralReward(referral.id);
              } else if (
                job.type === 'BOOKING_REMINDER' &&
                b.status === 'CONFIRMED' &&
                ['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
              )
                await this.notifications.sendNotification(
                  b.guestId,
                  'BOOKING_CONFIRMED',
                  'Check-in reminder',
                  `Your stay at ${b.property.title} starts soon`,
                  { bookingId: b.id, eventKey: `reminder:${b.id}` },
                );
            }
          }
          await this.prisma.domainJob.update({
            where: { id: job.id },
            data: {
              completedAt: new Date(),
              lockedUntil: null,
              lastError: null,
            },
          });
          processed++;
        } catch (e: any) {
          await this.prisma.domainJob.update({
            where: { id: job.id },
            data: {
              lockedUntil: null,
              availableAt: new Date(
                Date.now() +
                  Math.min(3600000, 15000 * 2 ** Math.min(job.attempts, 8)),
              ),
              lastError: String(e?.message || 'Job failed').slice(0, 1000),
            },
          });
        }
      }
    } finally {
      this.running = false;
    }
    return { processed };
  }
}
