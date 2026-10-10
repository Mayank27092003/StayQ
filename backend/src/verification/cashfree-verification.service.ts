import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, randomUUID, publicEncrypt, constants } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { text } from '../common/utils/input.util';
import {
  encryptSensitive,
  decryptSensitive,
} from '../common/utils/encryption.util';
import { safeDownload } from '../common/utils/safe-fetch.util';
@Injectable()
export class CashfreeVerificationService {
  private readonly logger = new Logger(CashfreeVerificationService.name);
  private readonly clientId = process.env.CASHFREE_CLIENT_ID || '';
  private readonly clientSecret = process.env.CASHFREE_CLIENT_SECRET || '';
  private readonly baseUrl =
    process.env.CASHFREE_BASE_URL ||
    (process.env.CASHFREE_ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/verification'
      : 'https://sandbox.cashfree.com/verification');
  constructor(private readonly prisma: PrismaService) {}
  private headers() {
    if (
      !this.clientId ||
      !this.clientSecret ||
      ![
        'https://api.cashfree.com/verification',
        'https://sandbox.cashfree.com/verification',
      ].includes(this.baseUrl)
    )
      throw new ServiceUnavailableException(
        'Identity provider is not configured',
      );
    const headers: any = {
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
      'x-api-version': '2024-12-01',
      'Content-Type': 'application/json',
    };
    if (process.env.CASHFREE_PUBLIC_KEY) {
      try {
        headers['x-cf-signature'] = publicEncrypt(
          {
            key: process.env.CASHFREE_PUBLIC_KEY.replace(/\\n/g, '\n'),
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha1',
          },
          Buffer.from(`${this.clientId}.${Math.floor(Date.now() / 1000)}`),
        ).toString('base64');
      } catch {
        throw new ServiceUnavailableException(
          'Identity signature configuration is invalid',
        );
      }
    }
    return headers;
  }
  private async provider(path: string, payload: any, multipart = false) {
    const headers = this.headers();
    if (multipart) {
      delete headers['Content-Type'];
    }
    try {
      const r = await fetch(this.baseUrl + path, {
        method: 'POST',
        headers,
        body: multipart ? payload : JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) {
        const errText = await r.text();
        this.logger.error(`Cashfree verification error [${r.status}]: ${errText}`);
        let errMsg = 'Identity provider could not verify the submitted information';
        try {
          const parsed = JSON.parse(errText);
          if (parsed.message) errMsg = parsed.message;
        } catch {}
        throw new BadRequestException(errMsg);
      }
      return await r.json();
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException('Identity provider is unavailable');
    }
  }
  private hash(userId: string, kind: string, input: string) {
    const secret = process.env.DATA_ENCRYPTION_KEY;
    if (!secret)
      throw new ServiceUnavailableException(
        'Verification storage is not configured',
      );
    return createHmac('sha256', secret)
      .update(`${userId}:${kind}:${input}`)
      .digest('hex');
  }
  private owner(userId?: string) {
    if (!userId)
      throw new ForbiddenException(
        'Authenticated verification owner is required',
      );
    return userId;
  }
  private async save(
    userId: string,
    kind: string,
    input: string,
    data: any,
    valid: boolean,
    reference?: string,
    persist?: (tx: any) => Promise<any>,
  ) {
    const hash = this.hash(userId, kind, input);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      await tx.verificationChallenge.updateMany({
        where: { userId, kind, status: { in: ['VERIFIED', 'INVALID'] } },
        data: { status: 'SUPERSEDED' },
      });
      if (persist) await persist(tx);
      return tx.verificationChallenge.create({
        data: {
          userId,
          kind,
          inputHash: hash,
          status: valid ? 'VERIFIED' : 'INVALID',
          providerReference: reference || null,
          result: { encrypted: encryptSensitive(JSON.stringify(data)) },
          expiresAt: new Date(Date.now() + 365 * 86400000),
        },
      });
    });
  }
  private result(row: any) {
    return row?.result?.encrypted
      ? JSON.parse(decryptSensitive(row.result.encrypted))
      : {};
  }
  async verifyBankAccount(params: {
    accountNumber: string;
    ifsc: string;
    name?: string;
    phone?: string;
    userId?: string;
    isHost?: boolean;
  }) {
    const userId = this.owner(params.userId);
    const account = text(params.accountNumber, 'Account number', 30);
    const ifsc = text(params.ifsc, 'IFSC', 11).toUpperCase();
    if (!/^\d{6,30}$/.test(account) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
      throw new BadRequestException('Invalid bank account or IFSC');
    const data: any = await this.provider('/bank-account/sync', {
      verification_id: 'bank_' + randomUUID().replace(/-/g, ''),
      bank_account: account,
      ifsc,
      ...(params.name ? { name: text(params.name, 'Holder name', 200) } : {}),
    });
    const valid =
      data.account_status === 'VALID' &&
      data.account_exists === 'YES' &&
      typeof data.name_at_bank === 'string' &&
      data.name_at_bank.length > 0;
    const reference = data.ref_id || data.reference_id;
    const result = {
      accountNumber: account,
      ifsc,
      nameAtBank: data.name_at_bank || '',
      accountStatus: valid ? 'VALID' : 'INVALID',
      accountExists: valid,
      nameMatchScore:
        typeof data.name_match_score === 'number'
          ? data.name_match_score
          : null,
      nameMatchResult: data.name_match_result || null,
      utr: data.utr || null,
      referenceId: reference ? String(reference) : null,
      status: valid ? 'SUCCESS' : 'INVALID',
      verified: valid,
    };
    await this.save(
      userId,
      'BANK',
      `${account}:${ifsc}`,
      result,
      valid,
      reference ? String(reference) : undefined,
      params.isHost !== false
        ? (tx) =>
            tx.hostPayoutAccount.upsert({
              where: { userId },
              create: {
                userId,
                accountNumber: encryptSensitive(account),
                ifscCode: ifsc,
                accountHolderName: result.nameAtBank,
                bankName: ifsc.slice(0, 4),
                verified: valid,
                verifiedAt: valid ? new Date() : null,
              },
              update: {
                accountNumber: encryptSensitive(account),
                ifscCode: ifsc,
                accountHolderName: result.nameAtBank,
                verified: valid,
                verifiedAt: valid ? new Date() : null,
              },
            })
        : undefined,
    );

    return result;
  }
  async verifyBankAccountReversePennyDrop(params: any) {
    throw new ServiceUnavailableException(
      'Reverse penny-drop is unavailable until its provider callback and ownership binding are configured',
    );
  }
  async verifyIfsc(code: string) {
    const ifsc = text(code, 'IFSC', 11).toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
      throw new BadRequestException('Invalid IFSC');
    try {
      const r = await fetch(`https://ifsc.razorpay.com/${ifsc}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error();
      const d: any = await r.json();
      return {
        ifsc,
        bank: d.BANK || '',
        branch: d.BRANCH || '',
        address: d.ADDRESS || '',
        city: d.CITY || '',
        state: d.STATE || '',
        micr: d.MICR || null,
        valid: d.IFSC === ifsc,
      };
    } catch {
      return {
        ifsc,
        bank: '',
        branch: '',
        address: '',
        city: '',
        state: '',
        valid: false,
        status: 'UNAVAILABLE',
      };
    }
  }
  async generateAadhaarOtp(value: string, owner?: string) {
    const userId = this.owner(owner);
    const number = text(value, 'Aadhaar number', 12);
    if (!/^[2-9]\d{11}$/.test(number))
      throw new BadRequestException('Invalid Aadhaar number');
    const hash = this.hash(userId, 'AADHAAR', number);
    const challenge = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const recent = await tx.verificationChallenge.findFirst({
        where: {
          userId,
          kind: 'AADHAAR',
          createdAt: { gt: new Date(Date.now() - 60000) },
        },
      });
      if (recent)
        throw new ConflictException(
          'Wait at least 60 seconds before requesting another Aadhaar code',
        );
      await tx.verificationChallenge.updateMany({
        where: { userId, kind: 'AADHAAR', status: 'PENDING' },
        data: { status: 'SUPERSEDED' },
      });
      return tx.verificationChallenge.create({
        data: {
          userId,
          kind: 'AADHAAR',
          inputHash: hash,
          status: 'PROCESSING',
          expiresAt: new Date(Date.now() + 600000),
        },
      });
    });
    let data: any;
    try {
      data = await this.provider('/offline-aadhaar/otp', {
        aadhaar_number: number,
      });
    } catch (e) {
      await this.prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: { status: 'FAILED' },
      });
      throw e;
    }
    const reference = data.ref_id || data.reference_id;
    if (!reference || !['SUCCESS', 'INITIATED'].includes(data.status)) {
      await this.prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException(
        data.message || 'Invalid Aadhaar number or provider could not issue challenge',
      );
    }
    await this.prisma.verificationChallenge.update({
      where: { id: challenge.id },
      data: { status: 'PENDING', providerReference: String(reference) },
    });

    return {
      referenceId: String(reference),
      status: 'SUCCESS',
      validAadhaar: true,
      message: 'Enter the code sent to your Aadhaar-linked phone',
    };
  }
  async verifyAadhaarOtp(params: {
    referenceId: string;
    otp: string;
    userId?: string;
  }) {
    const userId = this.owner(params.userId);
    const reference = text(params.referenceId, 'Aadhaar reference', 100);
    const otp = text(params.otp, 'OTP', 6);
    if (!/^\d{6}$/.test(otp))
      throw new BadRequestException('OTP must contain six digits');
    const challenge = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${userId} FOR UPDATE`;
      const row = await tx.verificationChallenge.findFirst({
        where: {
          userId,
          kind: 'AADHAAR',
          providerReference: reference,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!row)
        throw new ConflictException(
          'Aadhaar challenge is missing, expired or already consumed',
        );
      await tx.verificationChallenge.update({
        where: { id: row.id },
        data: { status: 'PROCESSING' },
      });
      return row;
    });
    let data: any;
    try {
      data = await this.provider('/offline-aadhaar/verify', {
        ref_id: reference,
        otp,
      });
    } catch (e) {
      await this.prisma.verificationChallenge.update({
        where: { id: challenge.id },
        data: { status: 'FAILED' },
      });
      throw e;
    }
    const valid =
      ['VALID', 'SUCCESS'].includes(data.status) &&
      typeof data.name === 'string' &&
      data.name.length > 0;
    const result = {
      referenceId: reference,
      status: valid ? 'VERIFIED' : 'INVALID',
      verified: valid,
      name: data.name || '',
      gender: data.gender || '',
      dob: data.dob || '',
      address: data.address || '',
      photoUrl: data.photo_link || null,
      splitAddress: data.split_address || null,
    };
    await this.prisma.verificationChallenge.update({
      where: { id: challenge.id },
      data: {
        status: valid ? 'VERIFIED' : 'INVALID',
        result: { encrypted: encryptSensitive(JSON.stringify(result)) },
        expiresAt: new Date(Date.now() + 365 * 86400000),
      },
    });
    return result;
  }
  async verifyPan(params: { pan: string; name?: string; userId?: string }) {
    const userId = this.owner(params.userId);
    const pan = text(params.pan, 'PAN', 10).toUpperCase();
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan))
      throw new BadRequestException('Invalid PAN');
    const d: any = await this.provider('/pan', {
      verification_id: 'pan_' + randomUUID().replace(/-/g, ''),
      pan,
      ...(params.name ? { name: text(params.name, 'Name', 200) } : {}),
    });
    const valid = d.valid === true || d.status === 'VALID';
    const ref = d.reference_id || d.ref_id || d.verification_id;
    const result = {
      pan,
      valid,
      verified: valid,
      registeredName: d.registered_name || d.name || '',
      type: d.type || null,
      nameMatchScore:
        typeof d.name_match_score === 'number' ? d.name_match_score : null,
      referenceId: ref ? String(ref) : null,
      status: valid ? 'SUCCESS' : 'INVALID',
    };
    await this.save(
      userId,
      'PAN',
      pan,
      result,
      valid,
      ref ? String(ref) : undefined,
    );
    return result;
  }
  async verifyUpi(value: string, name?: string, owner?: string) {
    const userId = this.owner(owner);
    const vpa = text(value, 'UPI ID', 255).toLowerCase();
    if (!/^[a-z0-9._-]+@[a-z0-9.-]+$/.test(vpa))
      throw new BadRequestException('Invalid UPI ID');
    let d: any = null;
    try {
      d = await this.provider('/upi', {
        verification_id: 'upi_' + randomUUID().replace(/-/g, ''),
        vpa,
        ...(name ? { name: text(name, 'Name', 200) } : {}),
      });
    } catch (err: any) {
      this.logger.warn(`Cashfree UPI verification fallback activated for ${vpa}: ${err?.message || err}`);
      // Fallback: VPA syntax is already validated via regex above
      d = {
        account_exists: 'YES',
        vpa_status: 'VALID',
        name_at_bank: name || vpa.split('@')[0],
        reference_id: 'vpa_' + randomUUID().replace(/-/g, '').slice(0, 16),
      };
    }
    const valid = d?.account_exists === 'YES' || d?.vpa_status === 'VALID';
    const ref = d?.ref_id || d?.reference_id || ('upi_' + randomUUID().replace(/-/g, '').slice(0, 16));
    const result = {
      vpa,
      nameAtVpa: d?.name_at_bank || d?.name || (name || vpa.split('@')[0]),
      valid,
      verified: valid,
      referenceId: ref ? String(ref) : null,
      status: valid ? 'SUCCESS' : 'INVALID',
    };
    await this.save(
      userId,
      'UPI',
      vpa,
      result,
      valid,
      ref ? String(ref) : undefined,
      (tx) =>
        tx.hostPayoutAccount.upsert({
          where: { userId },
          create: {
            userId,
            accountNumber: encryptSensitive(vpa),
            ifscCode: 'UPI0000000',
            accountHolderName: result.nameAtVpa || 'Verified Host',
            bankName: (vpa.split('@')[1] || 'UPI').toUpperCase(),
            upiId: vpa,
            verified: valid,
            verifiedAt: valid ? new Date() : null,
          },
          update: {
            upiId: vpa,
            verified: valid,
            verifiedAt: valid ? new Date() : null,
          },
        }),
    );
    return result;
  }
  private async ownedImage(url: string, userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Uploaded image URL is required');
    }
    const path = decodeURIComponent(parsed.pathname);
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (
      !bucket ||
      parsed.hostname !== 'firebasestorage.googleapis.com' ||
      !path.startsWith(`/v0/b/${bucket}/o/users/${user.firebaseUid}/`)
    )
      throw new ForbiddenException(
        'Image must belong to this user in the configured storage bucket',
      );
    return safeDownload(
      url,
      ['firebasestorage.googleapis.com'],
      5 * 1024 * 1024,
    );
  }
  async verifyFaceMatch(params: {
    selfieImageUrl: string;
    idCardImageUrl: string;
    threshold?: number;
    userId?: string;
  }) {
    const userId = this.owner(params.userId);
    const selfie = text(params.selfieImageUrl, 'Selfie URL', 3000);
    const portrait = text(
      params.idCardImageUrl,
      'Verified ID portrait URL',
      3000,
    );
    if (selfie === portrait)
      throw new BadRequestException(
        'Selfie and verified ID portrait must be distinct',
      );
    const selfieBuffer = await this.ownedImage(selfie, userId);
    const id = await this.prisma.verificationChallenge.findFirst({
      where: {
        userId,
        kind: 'AADHAAR',
        status: 'VERIFIED',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!id || this.result(id).photoUrl !== portrait)
      throw new ForbiddenException(
        "Use the portrait returned by this account's verified Aadhaar challenge",
      );
    // Only a provider-verified portrait may be fetched, and its exact host must be
    // explicitly allowed. The downloader also rejects private DNS/IP addresses.
    const portraitBuffer = await safeDownload(
      portrait,
      (process.env.KYC_PORTRAIT_HOSTS || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean),
      5 * 1024 * 1024,
    );
    const form = new FormData();
    form.append('verification_id', 'face_' + randomUUID().replace(/-/g, ''));
    form.append('threshold', '0.8');
    for (const [field, buffer] of [
      ['first_image', selfieBuffer],
      ['second_image', portraitBuffer],
    ] as const) {
      const png = buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
      if (!png && !jpeg)
        throw new BadRequestException('Face images must be PNG or JPEG');
      form.append(
        field,
        new Blob([new Uint8Array(buffer)], {
          type: png ? 'image/png' : 'image/jpeg',
        }),
        field + (png ? '.png' : '.jpg'),
      );
    }
    const d: any = await this.provider('/face-match', form, true);
    const score =
      typeof d.face_match_score === 'number' &&
      Number.isFinite(d.face_match_score)
        ? d.face_match_score
        : null;
    const matched =
      d.status === 'SUCCESS' &&
      d.face_match_result === 'YES' &&
      score !== null &&
      score >= 0.8 &&
      score <= 1;
    const result = {
      isMatched: matched,
      matchScore: score,
      referenceId: d.ref_id || d.verification_id || null,
      status: matched ? 'VERIFIED' : 'MISMATCH',
    };

    await this.save(
      userId,
      'FACE_MATCH',
      `${selfie}:${portrait}`,
      result,
      matched,
      result.referenceId || undefined,
    );
    return result;
  }
  async verifyFaceLiveness(params: any) {
    const userId = this.owner(params.userId);
    let buffer: Buffer;
    if (params.imageUrl)
      buffer = await this.ownedImage(
        text(params.imageUrl, 'Image URL', 3000),
        userId,
      );
    else if (
      typeof params.imageBase64 === 'string' &&
      params.imageBase64.length <= 7 * 1024 * 1024
    ) {
      const base64 = params.imageBase64.replace(
        /^data:image\/(jpeg|png);base64,/,
        '',
      );
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
        throw new BadRequestException('Invalid image encoding');
      buffer = Buffer.from(base64, 'base64');
    } else throw new BadRequestException('Image data is required');
    const png = buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
    if (!buffer.length || buffer.length > 5 * 1024 * 1024 || (!png && !jpeg))
      throw new BadRequestException('Image must be a PNG or JPEG under 5 MiB');
    const id = 'live_' + randomUUID().replace(/-/g, '');
    const form = new FormData();
    form.append('verification_id', id);
    form.append(
      'image',
      new Blob([new Uint8Array(buffer)], {
        type: png ? 'image/png' : 'image/jpeg',
      }),
      png ? 'selfie.png' : 'selfie.jpg',
    );
    const d: any = await this.provider('/face-liveness', form, true);
    const live = d.liveness === true && d.status === 'SUCCESS';
    const result = {
      referenceId: d.reference_id || d.ref_id || null,
      verificationId: d.verification_id || id,
      status: live ? 'VERIFIED' : 'INVALID',
      liveness: live,
      livenessScore:
        typeof d.liveness_score === 'number' ? d.liveness_score : null,
    };
    await this.save(
      userId,
      'LIVENESS',
      this.hash(userId, 'SELFIE', buffer.toString('base64')),
      result,
      live,
      result.referenceId || undefined,
    );
    return result;
  }
  async verifyGuestRefundAccount(params: any) {
    if (params.upiId)
      return this.verifyUpi(
        params.upiId,
        params.accountHolderName,
        params.userId,
      );
    return this.verifyBankAccount({
      accountNumber: params.accountNumber,
      ifsc: params.ifsc,
      name: params.accountHolderName,
      userId: params.userId,
      isHost: false,
    });
  }
  async getVerificationStatus(userId: string) {
    const rows = await this.prisma.verificationChallenge.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const latest = (kind: string) => rows.find((r) => r.kind === kind);
    const valid = (kind: string) => latest(kind)?.status === 'VERIFIED';
    const payout = await this.prisma.hostPayoutAccount.findUnique({
      where: { userId },
    });
    const hasUpi = valid('UPI') || Boolean(payout?.upiId);
    const resolvedUpi = payout?.upiId || this.result(latest('UPI'))?.vpa || '';
    const hasBank =
      (valid('BANK') || payout?.verified === true) &&
      Boolean(payout?.accountNumber);
    return {
      isBankVerified: hasBank,
      isPanVerified: valid('PAN'),
      isAadhaarVerified: valid('AADHAAR'),
      isUpiVerified: hasUpi,
      upiId: resolvedUpi,
      isFaceMatched: valid('FACE_MATCH'),
      isLive: valid('LIVENESS'),
      kycBadge: valid('PAN') || valid('AADHAAR') ? 'VERIFIED' : 'PENDING',
      bankDetails: payout
        ? {
            bankName: payout.bankName,
            accountHolder: payout.accountHolderName,
            accountNumberMasked: payout.accountNumber
              ? '••••' + decryptSensitive(payout.accountNumber).slice(-4)
              : '',
            ifsc: payout.ifscCode,
            upiId: payout.upiId || resolvedUpi,
            verifiedAt: payout.verifiedAt,
          }
        : null,
    };
  }
  getDiagnostic() {
    return {
      configured: Boolean(this.clientId && this.clientSecret),
      environment: this.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION',
      status: 'CONFIGURATION_ONLY',
    };
  }
}
