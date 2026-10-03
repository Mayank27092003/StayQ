import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncProfileDto } from './dto/sync-profile.dto';
import { EmailService } from '../notifications/email.service';

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, OtpEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async syncProfile(userId: string, dto: SyncProfileDto) {
    const data: any = { ...dto };
    if (dto.dob) {
      try {
        data.dob = new Date(dto.dob);
      } catch {
        delete data.dob;
      }
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async sendEmailOtp(email: string, userName?: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpStore.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
    });

    this.logger.log(`Generated OTP for ${cleanEmail}. Delivering via hello@stayq.space...`);

    const sent = await this.emailService.sendOtpEmail({
      to: cleanEmail,
      otp,
      userName,
    });

    if (!sent) {
      throw new BadRequestException('Failed to deliver OTP to the requested email. Please check the address and try again.');
    }

    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    };
  }

  async verifyEmailOtp(email: string, otp: string, userId?: string): Promise<{ success: boolean; message: string; email: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = this.otpStore.get(cleanEmail);
    if (!record) {
      throw new BadRequestException('No verification OTP found for this email. Please request a new code.');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(cleanEmail);
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    if (record.attempts >= 5) {
      this.otpStore.delete(cleanEmail);
      throw new BadRequestException('Too many incorrect attempts. Please request a new code.');
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      throw new BadRequestException('Invalid verification code. Please check your email and try again.');
    }

    // OTP match verified!
    this.otpStore.delete(cleanEmail);

    if (userId) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { email: cleanEmail },
        });
      } catch (err) {
        this.logger.warn(`Could not sync verified email to user ${userId} in DB: ${err}`);
      }
    }

    return {
      success: true,
      message: 'Email successfully verified!',
      email: cleanEmail,
    };
  }

  async becomeHost(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    
    if (user.roles.includes('HOST')) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          push: 'HOST',
        },
      },
    });
  }
}
