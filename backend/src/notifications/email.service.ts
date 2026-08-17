import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { EmailTemplates } from './templates/email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST') || process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '465', 10);
    const secure = (this.configService.get<string>('SMTP_SECURE') || process.env.SMTP_SECURE || 'true') === 'true' || port === 465;
    const user = this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER || 'grievance@stayq.space';
    const pass = this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS || 'vgnt-fjmh-apbz-zy87';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465 SSL
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.logger.log(`Hostinger SMTP Transporter initialized for ${user} (${host}:${port})`);
    } else {
      this.logger.warn('SMTP Credentials missing, falling back to Firestore email queue');
    }
  }

  /**
   * Send an email via Hostinger SSL SMTP (with Firestore queue fallback)
   */
  async sendEmail(to: string, subject: string, body: string, isHtml = true): Promise<boolean> {
    if (!to) return false;

    const fromAddress = this.configService.get<string>('SMTP_FROM') || process.env.SMTP_FROM || 'Stay Q <grievance@stayq.space>';

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

        this.logger.log(`Email successfully delivered to ${to} (MessageId: ${info.messageId})`);
        return true;
      } catch (smtpError: any) {
        this.logger.error(`Hostinger SMTP failed for ${to}: ${smtpError?.message}`, smtpError?.stack);
      }
    }

    // 2. Fallback to Firestore Trigger Email collection
    try {
      await getFirestore().collection('mail').add({
        to: to,
        message: {
          subject: subject,
          html: isHtml ? body : undefined,
          text: !isHtml ? body : undefined,
        },
        createdAt: FieldValue.serverTimestamp(),
      });
      this.logger.log(`Email queued in Firestore 'mail' collection for ${to}`);
      return true;
    } catch (fallbackError) {
      this.logger.error(`Both SMTP and Firestore fallback failed for ${to}:`, fallbackError);
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
  async sendHostApplicationReceivedEmail(params: { to: string; hostName: string; propertyTitle: string; city: string }) {
    const tpl = EmailTemplates.hostApplicationReceived(params.hostName, params.propertyTitle, params.city);
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 4. New Host Submission Admin Alert
   */
  async sendNewHostAdminAlert(params: { hostName: string; hostEmail: string; hostPhone: string; propertyTitle: string; city: string }) {
    const tpl = EmailTemplates.newHostAdminAlert(params.hostName, params.hostEmail, params.hostPhone, params.propertyTitle, params.city);
    return this.sendEmail('grievance@stayq.space', tpl.subject, tpl.html, true);
  }

  /**
   * 5. Host Approved Notification
   */
  async sendHostApprovedEmail(params: { to: string; hostName: string; propertyTitle: string }) {
    const tpl = EmailTemplates.hostApproved(params.hostName, params.propertyTitle);
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }

  /**
   * 6. Property Live Notification
   */
  async sendPropertyLiveEmail(params: { to: string; hostName: string; propertyTitle: string; propertyCode: string }) {
    const tpl = EmailTemplates.propertyLiveNotification(params.hostName, params.propertyTitle, params.propertyCode);
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
  async sendSupportTicketUpdate(params: { to: string; recipientName: string; ticketId: string; subjectText: string; message: string }) {
    const tpl = EmailTemplates.supportTicketUpdate({
      recipientName: params.recipientName,
      ticketId: params.ticketId,
      subjectText: params.subjectText,
      message: params.message,
    });
    return this.sendEmail(params.to, tpl.subject, tpl.html, true);
  }
}
