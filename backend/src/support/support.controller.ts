import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupportService } from './support.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * 1. AI Triage Chat:
   * Tier-1 automated support with pre-written resolution pathways
   */
  @Public()
  @Post('ai-triage')
  @Throttle({ ai: { limit: 15, ttl: 60000 } })
  async aiTriage(
    @Body()
    body: {
      message: string;
      topic?: string;
      chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
  ) {
    const reply = await this.supportService.aiTriage(
      body.message,
      body.topic,
      body.chatHistory,
    );
    return { reply };
  }

  /**
   * 2. Public / Guest: Create a real support ticket & escalate to human agent
   */
  @Post('tickets')
  async createTicket(
    @CurrentUser() user: User,
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
      category?: string;
      priority?: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
      chatTranscript?: Array<{ sender: string; text: string }>;
      bookingId?: string;
      userId?: string;
    },
  ) {
    return this.supportService.createTicket(body, user);
  }

  /**
   * 3. List support tickets (Authenticated: users see own tickets; admins see all)
   */
  @Get('tickets')
  @UseGuards(FirebaseAuthGuard)
  async listTickets(
    @CurrentUser() user: User,
    @Query()
    query: {
      status?: string;
      category?: string;
      search?: string;
      email?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const effectiveQuery: any = { ...query };
    if (!user.isAdmin) {
      effectiveQuery.userId = user.id;
      if (user.email) effectiveQuery.email = user.email;
    }
    return this.supportService.listTickets(effectiveQuery, user);
  }

  /**
   * 4. Get ticket details with message thread (Scoped to owner or admin)
   */
  @Get('tickets/:id')
  @UseGuards(FirebaseAuthGuard)
  async getTicket(@CurrentUser() user: User, @Param('id') id: string) {
    const ticket = await this.supportService.getTicket(id, user);
    return ticket;
  }

  /**
   * 5. Update ticket status / mark resolved (Admin only)
   */
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Patch('tickets/:id')
  async updateTicket(
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
      resolution?: string;
      assignedTo?: string;
      priority?: 'NORMAL' | 'HIGH' | 'URGENT' | 'LOW';
    },
  ) {
    return this.supportService.updateTicket(id, body);
  }

  /**
   * 6. Add reply message to ticket thread (Protected against author spoofing)
   */
  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body()
    body: {
      authorType?: 'USER' | 'ADMIN' | 'SYSTEM';
      authorName?: string;
      authorId?: string;
      body: string;
      internal?: boolean;
    },
    @Req() req: any,
  ) {
    return this.supportService.addMessage(id, body, req.user);
  }
}
