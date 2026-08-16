import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CapacityEngineService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(slotId: string, requestedSpots: number): Promise<boolean> {
    const slot = await this.prisma.experienceSlot.findUnique({ where: { id: slotId } });
    if (!slot) return false;
    
    return (slot.spotsTotal - slot.spotsTaken) >= requestedSpots;
  }

  async bookSlot(slotId: string, quantity: number, userId?: string) {
    // Atomic update using Prisma where condition to prevent race condition
    const res = await this.prisma.experienceSlot.updateMany({
      where: { 
        id: slotId,
        spotsTotal: {
          gte: quantity // We ideally want to check spotsTotal - spotsTaken >= quantity
        }
      },
      data: {
        spotsTaken: { increment: quantity }
      }
    });
    
    if (res.count === 0) {
       // Let's do it safer with a raw query for Postgres
       const count = await this.prisma.$executeRaw`
          UPDATE "ExperienceSlot"
          SET "spotsTaken" = "spotsTaken" + ${quantity}
          WHERE "id" = ${slotId} AND "spotsTotal" - "spotsTaken" >= ${quantity}
       `;
       if (count === 0) {
         throw new BadRequestException('Not enough capacity or slot not found');
       }
    }
    
    return this.prisma.experienceSlot.findUnique({ where: { id: slotId } });
  }
}
