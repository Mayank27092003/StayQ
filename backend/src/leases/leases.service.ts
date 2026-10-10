import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { dateOnly, integer, money, text } from '../common/utils/input.util';
const leaseAdmin = (u: any) =>
  u?.isAdmin &&
  ['SUPER_ADMIN', 'OPERATIONS', 'TRUST_SAFETY'].includes(u.adminRole);
@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}
  private signature(value: string, u: any) {
    let url: URL;
    try {
      url = new URL(text(value, 'Signature URL', 2048));
    } catch {
      throw new BadRequestException('Invalid signature URL');
    }
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    const path = decodeURIComponent(url.pathname);
    if (
      !bucket ||
      url.protocol !== 'https:' ||
      url.hostname !== 'firebasestorage.googleapis.com' ||
      !path.startsWith('/v0/b/' + bucket + '/o/users/' + u.firebaseUid + '/')
    )
      throw new BadRequestException(
        'Upload the signature into your own configured storage folder',
      );
    return url.toString();
  }
  async createLease(dto: any, user?: any) {
    if (!user?.id)
      throw new ForbiddenException('Authenticated property owner required');
    const start = dateOnly(dto.startDate, 'Lease start'),
      end = dateOnly(dto.endDate, 'Lease end');
    if (end <= start)
      throw new BadRequestException('Lease end must follow start');
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${dto.propertyId} FOR UPDATE`;
      const p = await tx.property.findUnique({ where: { id: dto.propertyId } });
      if (!p) throw new NotFoundException('Property not found');
      if (p.hostId !== user.id && !leaseAdmin(user))
        throw new ForbiddenException('Property owner required');
      if (!dto.bookingId)
        throw new BadRequestException('A paid booking is required');
      const b = await tx.booking.findUnique({
        where: { id: dto.bookingId },
        include: { payment: true },
      });
      if (
        !b ||
        b.propertyId !== p.id ||
        !['CONFIRMED', 'COMPLETED'].includes(b.status) ||
        !['CAPTURED', 'RELEASED'].includes(b.payment?.status || '')
      )
        throw new BadRequestException(
          'A matching confirmed paid booking is required',
        );
      const existing = await tx.leaseAgreement.findUnique({
        where: { bookingId: b.id },
      });
      if (existing) return existing;
      const overlap = await tx.leaseAgreement.findFirst({
        where: {
          propertyId: p.id,
          status: {
            in: ['PENDING_TENANT_SIGN', 'PENDING_OWNER_SIGN', 'ACTIVE'],
          },
          leaseStartDate: { lt: end },
          leaseEndDate: { gt: start },
        },
      });
      if (overlap)
        throw new ConflictException('Lease dates overlap another contract');
      if (!p.monthlyRent)
        throw new BadRequestException(
          'Configure monthly rent before creating a lease',
        );
      const url = dto.agreementDocUrl
        ? this.signature(dto.agreementDocUrl, user)
        : undefined;
      return tx.leaseAgreement.create({
        data: {
          bookingId: b.id,
          propertyId: p.id,
          leaseDurationMonths: integer(
            p.leaseDurationMonths || 11,
            'Duration',
            1,
            120,
          ),
          monthlyRent: money(Number(p.monthlyRent), 'Monthly rent'),
          securityDeposit: money(
            Number(p.securityDeposit || 0),
            'Security deposit',
            true,
          ),
          leaseStartDate: start,
          leaseEndDate: end,
          platformFee: 0,
          agreementDocUrl: url,
          status: 'PENDING_TENANT_SIGN',
        },
      });
    });
  }
  async signLease(id: string, user: any, signatureUrl?: string) {
    if (!user?.id)
      throw new ForbiddenException('Authenticated signing party required');
    const url = this.signature(signatureUrl!, user);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "LeaseAgreement" WHERE id=${id} FOR UPDATE`;
      const l = await tx.leaseAgreement.findUnique({
        where: { id },
        include: { booking: true, property: true },
      });
      if (!l) throw new NotFoundException('Lease not found');
      const tenant = l.booking.guestId === user.id,
        owner = l.property.hostId === user.id;
      if (!tenant && !owner)
        throw new ForbiddenException(
          'Only the actual tenant or landlord can sign',
        );
      if (!l.agreementDocUrl)
        throw new ConflictException(
          'Upload the agreement document before collecting signatures',
        );
      if (tenant && l.tenantSignatureUrl) {
        if (l.tenantSignatureUrl !== url)
          throw new ConflictException('A tenant signature is already recorded');
        return l;
      }
      if (owner && l.ownerSignatureUrl) {
        if (l.ownerSignatureUrl !== url)
          throw new ConflictException('An owner signature is already recorded');
        return l;
      }
      if (tenant && l.status === 'PENDING_TENANT_SIGN')
        return tx.leaseAgreement.update({
          where: { id },
          data: {
            tenantSignatureUrl: url,
            tenantSignedAt: new Date(),
            status: 'PENDING_OWNER_SIGN',
          },
        });
      if (owner && l.status === 'PENDING_OWNER_SIGN' && l.tenantSignedAt)
        return tx.leaseAgreement.update({
          where: { id },
          data: {
            ownerSignatureUrl: url,
            ownerSignedAt: new Date(),
            status: 'ACTIVE',
          },
        });
      throw new ConflictException('Lease is not awaiting this signature');
    });
  }
  async generateLeasePdf(id: string, user?: any) {
    const l = await this.prisma.leaseAgreement.findUnique({
      where: { id },
      include: { booking: true, property: true },
    });
    if (!l) throw new NotFoundException('Lease not found');
    if (
      !user?.id ||
      (l.booking.guestId !== user.id &&
        l.property.hostId !== user.id &&
        !leaseAdmin(user))
    )
      throw new ForbiddenException('Lease participant required');
    if (!l.agreementDocUrl)
      throw new ServiceUnavailableException(
        'No agreement document has been uploaded; automatic document generation is not configured',
      );
    return { id: l.id, agreementDocUrl: l.agreementDocUrl, status: l.status };
  }
  async processMonthlyRent() {
    throw new ServiceUnavailableException(
      'Recurring rent collection requires a configured mandate and settlement integration',
    );
  }
}
