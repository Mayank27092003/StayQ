import { Injectable } from '@nestjs/common';
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
  status?: 'INVITED' | 'FORM_SUBMITTED' | 'CONTACTED' | 'ONBOARDED' | 'REJECTED';
  expectedPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class HostLeadsService {
  // Live dynamic storage initialized completely empty with zero mock data
  private static leads: HostLeadDto[] = [];

  constructor(private prisma: PrismaService) {}

  async createLead(data: HostLeadDto): Promise<HostLeadDto> {
    const newLead: HostLeadDto = {
      ...data,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channel: data.channel || 'WEBSITE_FORM',
      status: data.status || 'FORM_SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    HostLeadsService.leads.unshift(newLead);
    return newLead;
  }

  async getAllLeads(): Promise<HostLeadDto[]> {
    return HostLeadsService.leads;
  }

  async updateLeadStatus(id: string, status: HostLeadDto['status']): Promise<HostLeadDto | null> {
    const lead = HostLeadsService.leads.find((l) => l.id === id);
    if (lead && status) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      return lead;
    }
    return null;
  }
}
