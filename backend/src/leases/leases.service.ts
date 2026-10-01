import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaseStatus } from '@prisma/client';

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createLease(createLeaseDto: any) {
    return this.prisma.leaseAgreement.create({
      data: {
        bookingId: createLeaseDto.bookingId,
        propertyId: createLeaseDto.propertyId,
        leaseDurationMonths: 11,
        monthlyRent: createLeaseDto.monthlyRent,
        securityDeposit: createLeaseDto.securityDeposit,
        leaseStartDate: new Date(createLeaseDto.startDate),
        leaseEndDate: new Date(createLeaseDto.endDate),
        platformFee: 500,
        status: LeaseStatus.DRAFT,
      },
    });
  }

  async generateLeasePdf(id: string, user?: any) {
    const lease = await this.prisma.leaseAgreement.findUnique({
      where: { id },
      include: {
        booking: { include: { property: true } },
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    if (user && lease.booking?.guestId !== user.id && lease.booking?.property?.hostId !== user.id && !user.isAdmin) {
      throw new ForbiddenException('Only the tenant, landlord, or admin can access lease documents');
    }
    
    const pdfUrl = 'https://cloud-storage.example.com/lease-docs/generated.pdf';
    
    return this.prisma.leaseAgreement.update({
      where: { id },
      data: { agreementDocUrl: pdfUrl },
    });
  }

  async processMonthlyRent() {
    return { status: 'Success', processed: 0 };
  }
}
