import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminConversationsService } from './admin-conversations.service';

@ApiTags('Admin / Conversations')
@ApiBearerAuth()
@Controller('admin/conversations')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminConversationsController {
  constructor(private readonly conversationsService: AdminConversationsService) {}

  @Get()
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  listConversations(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.listConversations({ search, page, limit });
  }

  @Get(':id')
  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }
}
