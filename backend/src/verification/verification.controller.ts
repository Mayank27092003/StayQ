import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CashfreeVerificationService } from './cashfree-verification.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('verification')
@UseGuards(FirebaseAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: CashfreeVerificationService) {}

  /**
   * 0. Diagnostic & Health status of Cashfree Secure ID Production Engine
   */
  @Get('diagnostic')
  async getDiagnostic() {
    return this.verificationService.getDiagnostic();
  }

  /**
   * 1. Bank Account Penny Drop Verification (For Host Payout or Guest Refund)
   */
  @Post('bank-account')
  async verifyBankAccount(
    @CurrentUser() user: User,
    @Body() body: { accountNumber: string; ifsc: string; name?: string; phone?: string; isHost?: boolean },
  ) {
    return this.verificationService.verifyBankAccount({
      accountNumber: body.accountNumber,
      ifsc: body.ifsc,
      name: body.name || undefined,
      phone: body.phone || undefined,
      userId: user.id,
      isHost: body.isHost !== undefined ? body.isHost : true,
    });
  }

  /**
   * Direct Test Bank Account Penny Drop (Host Onboarding / Diagnostics)
   */
  @Post('test-bank')
  async testBankAccount(
    @CurrentUser() user: User,
    @Body() body: { accountNumber: string; ifsc: string; name?: string; phone?: string },
  ) {
    return this.verificationService.verifyBankAccount({
      accountNumber: body.accountNumber,
      ifsc: body.ifsc,
      name: body.name || undefined,
      phone: body.phone || undefined,
      userId: user.id,
    });
  }

  /**
   * 2. Reverse Penny Drop (Generates instant ₹1 verification transfer request)
   */
  @Post('reverse-penny-drop')
  async reversePennyDrop(
    @Body() body: { phone: string; name?: string },
  ) {
    return this.verificationService.verifyBankAccountReversePennyDrop({
      phone: body.phone,
      name: body.name,
    });
  }

  /**
   * 3. IFSC Code Lookup & Branch Details
   */
  @Get('ifsc/:code')
  async lookupIfsc(@Param('code') code: string) {
    return this.verificationService.verifyIfsc(code);
  }

  /**
   * 4. Aadhaar OKYC — Generate OTP to linked phone
   */
  @Post('aadhaar/generate-otp')
  async generateAadhaarOtp(
    @Body() body: { aadhaarNumber: string },
  ) {
    return this.verificationService.generateAadhaarOtp(body.aadhaarNumber);
  }

  /**
   * 5. Aadhaar OKYC — Submit OTP & auto-verify UIDAI profile
   */
  @Post('aadhaar/verify-otp')
  async verifyAadhaarOtp(
    @CurrentUser() user: User,
    @Body() body: { referenceId: string; otp: string },
  ) {
    return this.verificationService.verifyAadhaarOtp({
      referenceId: body.referenceId,
      otp: body.otp,
      userId: user.id,
    });
  }

  /**
   * 6. PAN Card Verification
   */
  @Post('pan')
  async verifyPan(
    @CurrentUser() user: User,
    @Body() body: { pan: string; name?: string },
  ) {
    return this.verificationService.verifyPan({
      pan: body.pan,
      name: body.name || undefined,
      userId: user.id,
    });
  }

  /**
   * Direct Test PAN Verification (Admin / Diagnostics)
   */
  @Post('test-pan')
  async testPan(
    @CurrentUser() user: User,
    @Body() body: { pan: string; name?: string },
  ) {
    return this.verificationService.verifyPan({
      pan: body.pan,
      name: body.name,
      userId: user.id,
    });
  }

  /**
   * 7. UPI ID Verification
   */
  @Post('upi')
  async verifyUpi(
    @Body() body: { vpa: string; name?: string },
  ) {
    return this.verificationService.verifyUpi(body.vpa, body.name || undefined);
  }

  /**
   * 7.5. Face Match & Live Face Verification
   */
  @Post('face-match')
  async verifyFaceMatch(
    @CurrentUser() user: User,
    @Body() body: { selfieImageUrl: string; idCardImageUrl: string; threshold?: number },
  ) {
    return this.verificationService.verifyFaceMatch({
      selfieImageUrl: body.selfieImageUrl,
      idCardImageUrl: body.idCardImageUrl,
      threshold: body.threshold,
      userId: user.id,
    });
  }

  /**
   * 7.6. Cashfree Face Liveness Check (Single-image real human anti-spoofing)
   */
  @Post('face-liveness')
  async verifyFaceLiveness(
    @CurrentUser() user: User,
    @Body() body: { imageUrl?: string; imageBase64?: string; verificationId?: string },
  ) {
    return this.verificationService.verifyFaceLiveness({
      imageUrl: body.imageUrl,
      imageBase64: body.imageBase64,
      verificationId: body.verificationId,
      userId: user.id,
    });
  }

  /**
   * 8. Guest Instant Refund Account Verification
   */
  @Post('guest-refund-account')
  async verifyGuestRefundAccount(
    @CurrentUser() user: User,
    @Body() body: { accountNumber?: string; ifsc?: string; upiId?: string; accountHolderName?: string },
  ) {
    return this.verificationService.verifyGuestRefundAccount({
      userId: user.id,
      accountNumber: body.accountNumber,
      ifsc: body.ifsc,
      upiId: body.upiId,
      accountHolderName: body.accountHolderName || user.displayName || undefined,
    });
  }

  /**
   * 9. Current User KYC & Verification Badges Status
   */
  @Get('status')
  async getVerificationStatus(@CurrentUser() user: User) {
    return this.verificationService.getVerificationStatus(user.id);
  }
}
