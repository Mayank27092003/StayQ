import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { integer } from '../common/utils/input.util';
@Injectable()
export class CapacityEngineService {
  constructor(private prisma: PrismaService) {}
  async checkAvailability(
    slotId: string,
    quantity: number,
    experienceId?: string,
  ) {
    integer(quantity, 'Quantity', 1, 1000);
    const s = await this.prisma.experienceSlot.findUnique({
      where: { id: slotId },
      include: { experience: { select: { status: true } } },
    });
    return !!(
      s &&
      s.experience.status === 'ACTIVE' &&
      s.date > new Date() &&
      (!experienceId || s.experienceId === experienceId) &&
      s.spotsTotal - s.spotsTaken >= quantity
    );
  }
  async bookSlot(
    slotId: string,
    quantity: number,
    userId?: string,
    experienceId?: string,
  ) {
    integer(quantity, 'Quantity', 1, 1000);
    throw new ServiceUnavailableException(
      'Standalone experience checkout requires durable paid reservation and refund integration; no inventory was changed',
    );
  }
  async releaseSlot(slotId: string, quantity: number) {
    integer(quantity, 'Quantity', 1, 1000);
    throw new ServiceUnavailableException(
      'Cancellation requires an owned reservation; direct inventory release is disabled',
    );
  }
}
