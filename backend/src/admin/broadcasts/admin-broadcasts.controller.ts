import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminBroadcastsService } from './admin-broadcasts.service';
import { BroadcastQueryDto } from './dto/broadcast.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Admin / Broadcasts')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, AdminGuard)
@Controller('admin/broadcasts')
export class AdminBroadcastsController {
  constructor(private readonly svc: AdminBroadcastsService) {}

  @Get()
  list(@Query() q: BroadcastQueryDto) {
    return this.svc.list(q);
  }

  @Post()
  create(@Body() body: any, @CurrentUser('id') adminId: string) {
    return this.svc.createAndDispatch(body, adminId);
  }

  @Post(':id/send')
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.send(id, adminId);
  }

  @Delete(':id')
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.svc.delete(id, adminId);
  }
}
