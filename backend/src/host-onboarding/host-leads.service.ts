import { text, money } from '../common/utils/input.util';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HostLeadDto {
  id?: string;
  hostName: string;
  propertyName: string;
  city: string;
  instagramHandle: string;
  phone: string;
  email?: string;
  channel?: 'INSTAGRAM' | 'WHATSAPP' | 'DIRECT' | 'WEBSITE_FORM';
  status?:
    'INVITED' | 'FORM_SUBMITTED' | 'CONTACTED' | 'ONBOARDED' | 'REJECTED';
  expectedPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class HostLeadsService {
  constructor(private prisma: PrismaService) {}
  async createLead(data: HostLeadDto, user: any) {
    return this.prisma.hostLead.create({
      data: {
        userId: user.id,
        hostName: text(data.hostName, 'Host name', 100),
        propertyName: text(data.propertyName, 'Property name', 200),
        city: text(data.city, 'City', 100),
        phone: text(data.phone, 'Phone', 30),
        email: user.email || null,
        instagramHandle: data.instagramHandle
          ? text(data.instagramHandle, 'Instagram', 100)
          : null,
        expectedPrice:
          data.expectedPrice === undefined
            ? null
            : money(data.expectedPrice, 'Expected price'),
        status: 'FORM_SUBMITTED',
        channel: 'WEBSITE_FORM',
      },
    });
  }
  async getAllLeads() {
    return this.prisma.hostLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
  async updateLeadStatus(id: string, status: HostLeadDto['status']) {
    if (
      ![
        'INVITED',
        'FORM_SUBMITTED',
        'CONTACTED',
        'ONBOARDED',
        'REJECTED',
      ].includes(status!)
    )
      throw new BadRequestException('Invalid lead status');
    return this.prisma.hostLead.update({ where: { id }, data: { status } });
  }
}
