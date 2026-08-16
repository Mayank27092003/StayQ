import { Injectable, NotFoundException } from '@nestjs/common';
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
        platformFee: 500, // Replace with logic
        status: LeaseStatus.DRAFT,
      },
    });
  }

  async generateLeasePdf(id: string) {
    const lease = await this.prisma.leaseAgreement.findUnique({ where: { id } });
    if (!lease) throw new NotFoundException('Lease not found');
    
    // PDF Generation logic would go here
    const pdfUrl = 'https://cloud-storage.example.com/lease-docs/generated.pdf';
    
    return this.prisma.leaseAgreement.update({
      where: { id },
      data: { agreementDocUrl: pdfUrl },
    });
  }

  async processMonthlyRent() {
    // Automation to collect rent for active leases
    return { status: 'Success', processed: 0 };
  }
}
