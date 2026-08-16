import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole, User } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminSupportService } from './admin-support.service';
import {
  CreateSupportMessageDto,
  SupportTicketQueryDto,
  UpdateSupportTicketDto,
} from './dto/support.dto';

@ApiTags('Admin / Support')
@ApiBearerAuth()
@Controller('admin/support')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminSupportController {
  constructor(private readonly support: AdminSupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets' })
  list(@Query() query: SupportTicketQueryDto) {
    return this.support.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Queue counters, first-response and resolution times' })
  summary() {
    return this.support.summary();
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get one ticket with its full message thread' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.support.findOne(id);
  }

  @Patch('tickets/:id')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Update status, priority, category, assignee, or resolution' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.support.update(id, dto, adminId);
  }

  @Post('tickets/:id/messages')
  @AdminRoles(AdminRole.OPERATIONS, AdminRole.TRUST_SAFETY)
  @ApiOperation({ summary: 'Append an admin reply or an internal note' })
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupportMessageDto,
    @CurrentUser() admin: User,
  ) {
    return this.support.addMessage(id, dto, admin);
  }
}
