import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { EmailTemplates, escapeHtml } from './templates/email-templates';

export type StayQMailbox = 'HELLO' | 'SUPPORT' | 'GRIEVANCE';

export const STAYQ_MAILBOXES = {
  HELLO: {
    address: 'hello@stayq.space',
    from: 'StayQ <hello@stayq.space>',
    label: 'StayQ Concierge & Platform',
  },
  SUPPORT: {
    address: 'support@stayq.space',
    from: 'StayQ Support <support@stayq.space>',
    label: 'StayQ 24/7 Priority Support Desk',
  },
  GRIEVANCE: {
    address: 'grievance@stayq.space',
    from: 'StayQ Grievance Officer <grievance@stayq.space>',
    label: 'StayQ Legal & Grievance Redressal',
  },
} as const;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host =
      this.configService.get<string>('SMTP_HOST') ||
      process.env.SMTP_HOST ||
      'smtp.hostinger.com';
    const port = parseInt(
      this.configService.get<string>('SMTP_PORT') ||
        process.env.SMTP_PORT ||
        '465',
      10,
    );
    const secure =
      (this.configService.get<string>('SMTP_SECURE') ||
        process.env.SMTP_SECURE ||
        'true') === 'true' || port === 465;
    const user =
      this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass =
      this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465 SSL
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });

      this.logger.log('SMTP transport configured');
    } else {
      this.logger.warn(
        'SMTP unavailable; email queue requires explicit configuration',
      );
    }
  }

  /**
   * Send an email via Hostinger SSL SMTP (with Firestore queue fallback)
   * Dispatched from one of the 3 official mailboxes: HELLO, SUPPORT, or GRIEVANCE.
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    isHtml = true,
    mailbox: StayQMailbox = 'HELLO',
  ): Promise<boolean> {
    if (
      typeof to !== 'string' ||
      !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to) ||
      to.length > 254
    )
      return false;

    const fromAddress =
      STAYQ_MAILBOXES[mailbox]?.from || 'StayQ <hello@stayq.space>';

    // 1. Try sending via direct Hostinger SSL SMTP
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html: isHtml ? body : undefined,
          text: !isHtml ? body : undefined,
        });

        this.logger.log(`SMTP email delivered to ${to} for subject "${subject}" (MessageID: ${info.messageId})`);
        return Array.isArray(info.accepted) && info.accepted.length > 0;
      } catch (smtpError: any) {
        this.logger.error(`SMTP submission failed to ${to}: ${smtpError?.message}`);
      }
    }

    if (this.configService.get<string>('EMAIL_QUEUE_ENABLED') !== 'true')
      return false;
    // Operator must configure the Trigger Email extension.
    try {
      await getFirestore()
        .collection(
          this.configService.get<string>('EMAIL_QUEUE_COLLECTION') || 'mail',
        )
        .add({
          to: to,
          message: {
            subject: subject,
            ...(isHtml ? { html: body } : { text: body }),
          },
          createdAt: FieldValue.serverTimestamp(),
        });
      this.logger.log('Email queued for configured delivery worker');
      return true;
    } catch (fallbackError) {
      this.logger.error('Email queue submission failed');
      return false;
    }
  }

  /**
   * 1. Booking Confirmation Email
   */
  async sendBookingConfirmationEmail(params: {
    to: string;
    guestName: string;
    propertyTitle: string;
    city: string;
    checkIn: string;
    checkOut: string;
    confirmationCode: string;
    totalAmount: number;
    numberOfNights: number;
  }) {
    const tpl = EmailTemplates.guestBookingConfirmed({
      guestName: params.guestName,
      propertyTitle: params.propertyTitle,
      city: params.city,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      confirmationCode: params.confirmationCode,
      totalAmount: params.totalAmount,
      nights: params.numberOfNights,
    });
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 2. Host New Booking Alert
   */
  async sendHostNewBookingAlert(params: {
    to: string;
    hostName: string;
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    payout: number;
    confirmationCode: string;
  }) {
    const tpl = EmailTemplates.hostNewBookingAlert(params);
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 3. Host Application Received
   */
  async sendHostApplicationReceivedEmail(params: {
    to: string;
    hostName: string;
    propertyTitle: string;
    city: string;
  }) {
    const tpl = EmailTemplates.hostApplicationReceived(
      params.hostName,
      params.propertyTitle,
      params.city,
    );
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 4. New Host Submission Admin Alert
   */
  async sendNewHostAdminAlert(params: {
    hostName: string;
    hostEmail: string;
    hostPhone: string;
    propertyTitle: string;
    city: string;
  }) {
    const tpl = EmailTemplates.newHostAdminAlert(
      params.hostName,
      params.hostEmail,
      params.hostPhone,
      params.propertyTitle,
      params.city,
    );
    return this.sendEmail(
      STAYQ_MAILBOXES.SUPPORT.address,
      tpl.subject,
      tpl.html,
      true,
      'HELLO',
    );
  }

  /**
   * 5. Host Approved Notification
   */
  async sendHostApprovedEmail(params: {
    to: string;
    hostName: string;
    propertyTitle: string;
  }) {
    const tpl = EmailTemplates.hostApproved(
      params.hostName,
      params.propertyTitle,
    );
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 6. Property Live Notification
   */
  async sendPropertyLiveEmail(params: {
    to: string;
    hostName: string;
    propertyTitle: string;
    propertyCode: string;
  }) {
    const tpl = EmailTemplates.propertyLiveNotification(
      params.hostName,
      params.propertyTitle,
      params.propertyCode,
    );
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 7. Staff Credentials & RBAC Welcome Email
   */
  async sendStaffCredentialsEmail(params: {
    staffName: string;
    staffId: string;
    email: string;
    initialPassword: string;
    department: string;
    allowedModules: string[];
  }) {
    const tpl = EmailTemplates.staffWelcomeCredentials(params);
    return this.sendEmail(params.email, tpl.subject, tpl.html, true);
  }

  /**
   * 8. Welcome New User / Guest
   */
  async sendWelcomeUserEmail(to: string, userName: string) {
    const tpl = EmailTemplates.welcomeNewUser(userName);
    return this.sendEmail(to, tpl.subject, tpl.html, true);
  }

  /**
   * 9. Support Ticket Update
   */
  async sendSupportTicketUpdate(params: {
    to: string;
    recipientName: string;
    ticketId: string;
    subjectText: string;
    message: string;
  }) {
    const tpl = EmailTemplates.supportTicketUpdate({
      recipientName: params.recipientName,
      ticketId: params.ticketId,
      subjectText: params.subjectText,
      message: params.message,
    });
    return this.sendEmail(params.to, tpl.subject, tpl.html, true, 'SUPPORT');
  }

  /**
   * 10. Email Verification OTP sent from hello@stayq.space
   */
  async sendOtpEmail(params: {
    to: string;
    otp: string;
    userName?: string;
  }): Promise<boolean> {
    if (!/^\d{6}$/.test(params.otp)) return false;
    const subject = 'Your StayQ Verification Code';
    const name = escapeHtml(params.userName || 'Traveler');
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>StayQ Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px 10px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(109,40,217,0.06); }
        .header { background: linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .logo { font-size: 26px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
        .subtext { font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; }
        .otp-box { background: #f5f3ff; border: 2px dashed #7C3AED; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #6D28D9; }
        .note { font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 16px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">✨ STAYQ</div>
          <div class="subtext">Secure Account Verification</div>
        </div>
        <div class="content">
          <h2 class="greeting">Verify Your Email Address</h2>
          <p style="font-size: 15px; color: #334155; line-height: 1.5;">
            Hi <b>${name}</b>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Please use the one-time verification code below to verify your email address on StayQ:
          </p>
          <div class="otp-box">
            <div style="font-size: 12px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your 6-Digit Code</div>
            <div class="otp-code">${params.otp}</div>
            <div style="font-size: 12px; color: #7C3AED; margin-top: 8px; font-weight: 600;">Valid for 10 minutes</div>
          </div>
          <p class="note">
            If you did not request this verification code, please ignore this email or reach us at <a href="mailto:hello@stayq.space" style="color: #7C3AED;">hello@stayq.space</a>.
          </p>
        </div>
        <div class="footer">
          © 2026 StayQ • Quatalyst Private Limited • Sent from hello@stayq.space
        </div>
      </div>
    </body>
    </html>
    `;
    return this.sendEmail(params.to, subject, html, true);
  }
}
