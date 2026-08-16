import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminQubeService } from './admin-qube.service';
import { ConversationQueryDto, CreateKnowledgeDto, KnowledgeQueryDto, UpdateKnowledgeDto } from './dto/qube-admin.dto';

@ApiTags('Admin / Qube AI')
@ApiBearerAuth()
@Controller('admin/qube')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminQubeController {
  constructor(private readonly svc: AdminQubeService) {}
  @Get('telemetry') telemetry() { return this.svc.telemetry(); }
  @Get('conversations') listConversations(@Query() q: ConversationQueryDto) { return this.svc.listConversations(q); }
  @Get('conversations/:id') findConversation(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findConversation(id); }
  @Get('knowledge') listKnowledge(@Query() q: KnowledgeQueryDto) { return this.svc.listKnowledge(q); }
  @Post('knowledge') @AdminRoles(AdminRole.OPERATIONS) create(@Body() dto: CreateKnowledgeDto, @CurrentUser('id') id: string) { return this.svc.createKnowledge(dto, id); }
  @Patch('knowledge/:id') @AdminRoles(AdminRole.OPERATIONS) update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKnowledgeDto, @CurrentUser('id') adminId: string) { return this.svc.updateKnowledge(id, dto, adminId); }
  @Delete('knowledge/:id') @AdminRoles(AdminRole.OPERATIONS) delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.svc.deleteKnowledge(id, adminId); }
}
