import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * 1. AI Triage Chat:
   * Tier-1 automated support with pre-written resolution pathways
   */
  @Post('ai-triage')
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
    return this.supportService.createTicket(body);
  }

  /**
   * 3. List support tickets (Public / Admin access)
   */
  @Get('tickets')
  async listTickets(
    @Query()
    query: {
      status?: string;
      category?: string;
      search?: string;
      email?: string;
    },
  ) {
    return this.supportService.listTickets(query);
  }

  /**
   * 4. Get ticket details with message thread
   */
  @Get('tickets/:id')
  async getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  /**
   * 5. Update ticket status / mark resolved
   */
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
   * 6. Add reply message to ticket thread
   */
  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body()
    body: {
      authorType: 'USER' | 'ADMIN' | 'SYSTEM';
      authorName?: string;
      authorId?: string;
      body: string;
      internal?: boolean;
    },
  ) {
    return this.supportService.addMessage(id, body);
  }
}
