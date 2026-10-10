import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './dto/sync-profile.dto';
import { EmailService } from '../notifications/email.service';
import { updateUserProfile } from '../users/profile.util';
import { text } from '../common/utils/input.util';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}
  async syncProfile(userId: string, dto: SyncProfileDto) {
    const updated = await updateUserProfile(this.prisma, userId, dto);
    if (updated?.email) {
      this.emailService
        .sendWelcomeUserEmail(updated.email, updated.displayName || 'Traveler')
        .catch(() => {});
      this.notificationsService
        .sendNotification(
          userId,
          NotificationType.PROMOTION,
          'Welcome to StayQ! 🎉',
          `Hi ${updated.displayName || 'Traveler'}, your StayQ account is active! Explore overland stays, RVs, and curated journeys.`,
          { eventKey: `welcome:${userId}` },
        )
        .catch(() => {});
    }
    return updated;
  }

  private email(value: unknown) {
    const email = text(value, 'Email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException('Invalid email');
    return email;
  }
  private digest(userId: string, email: string, otp: string) {
    const secret = process.env.OTP_HMAC_SECRET;
    if (!secret || secret.length < 32)
      throw new ServiceUnavailableException(
        'Email verification is not configured',
      );
    return createHmac('sha256', secret)
      .update(`${userId}:${email}:${otp}`)
      .digest('hex');
  }
  async sendEmailOtp(email: string, userName?: string, userId?: string) {
    if (!userId)
      throw new UnauthorizedException('Sign in before verifying email');
    const clean = this.email(email);
    const otp = randomInt(100000, 1000000).toString();
    const digest = this.digest(userId, clean, otp);
    const session = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const previous = await tx.otpSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (previous && Date.now() - previous.createdAt.getTime() < 60000)
        throw new BadRequestException(
          'Wait 60 seconds before requesting another code',
        );
      await tx.otpSession.deleteMany({ where: { userId } });
      return tx.otpSession.create({
        data: {
          userId,
          phone: clean,
          otp: digest,
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    });
    try {
      const sent = await this.emailService.sendOtpEmail({
        to: clean,
        otp,
        userName,
      });
      if (!sent)
        throw new ServiceUnavailableException(
          'Verification email could not be delivered',
        );
    } catch {
      await this.prisma.otpSession.deleteMany({ where: { id: session.id } });
      throw new ServiceUnavailableException(
        'Verification email could not be delivered',
      );
    }
    return { success: true, message: 'Verification code sent' };
  }
  async verifyEmailOtp(email: string, otp: string, userId?: string) {
    if (!userId)
      throw new UnauthorizedException('Sign in before verifying email');
    const clean = this.email(email);
    const code = text(otp, 'Verification code', 6);
    if (!/^\d{6}$/.test(code))
      throw new BadRequestException(
        'Verification code must contain six digits',
      );
    const digest = this.digest(userId, clean, code);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const session = await tx.otpSession.findFirst({
        where: { userId, phone: clean },
        orderBy: { createdAt: 'desc' },
      });
      if (
        !session ||
        session.consumedAt ||
        session.expiresAt <= new Date() ||
        session.attempts >= 5
      )
        return false;
      await tx.otpSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      const valid =
        session.otp.length === digest.length &&
        timingSafeEqual(Buffer.from(session.otp), Buffer.from(digest));
      if (!valid) return false; // Commit the failed attempt before reporting the error.
      // Allow multiple accounts to share the same email address as requested
      await tx.user.update({
        where: { id: userId },
        data: { email: clean, emailVerified: true },
      });
      await tx.otpSession.update({
        where: { id: session.id },
        data: { consumedAt: new Date(), otp: '' },
      });
      return true;
    });
    if (!result)
      throw new BadRequestException(
        'Invalid, expired or already used verification code',
      );

    // Send welcome email upon verifying email
    this.emailService
      .sendWelcomeUserEmail(clean, 'Traveler')
      .catch(() => {});
    this.notificationsService
      .sendNotification(
        userId,
        NotificationType.PROMOTION,
        'Email Address Verified ✓',
        'Your email address has been verified on StayQ via hello@stayq.space.',
        { eventKey: `email-verified:${userId}` },
      )
      .catch(() => {});

    return {
      success: true,
      verified: true,
      message: 'Email verified',
      email: clean,
      emailVerified: true,
      isEmailVerified: true,
    };
  }

  async becomeHost(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.hostStatus === 'SUSPENDED')
      throw new ConflictException(
        'Contact support to review your host suspension',
      );
    if (user.roles.includes('HOST') || user.hostStatus === 'PENDING')
      return user;
    return this.prisma.user.update({
      where: { id: userId },
      data: { hostStatus: 'PENDING', hostStatusUpdatedAt: new Date() },
    });
  }
}
