import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async raiseDispute(createDisputeDto: any) {
    return this.prisma.dispute.create({
      data: {
        bookingId: createDisputeDto.bookingId,
        raisedBy: createDisputeDto.raisedBy,
        reason: createDisputeDto.reason,
        description: createDisputeDto.description,
        status: DisputeStatus.OPEN,
      },
    });
  }

  async resolveDispute(id: string, resolveDto: any) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: resolveDto.status,
        resolution: resolveDto.resolution,
        resolvedBy: resolveDto.resolvedBy,
        resolvedAt: new Date(),
      },
    });
  }
}
