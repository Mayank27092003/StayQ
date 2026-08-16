import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminPromotionsService } from './admin-promotions.service';
import {
  CreatePromotionDto,
  PromotionQueryDto,
  PromotionSummaryQueryDto,
  UpdatePromotionDto,
  UpdatePromotionStatusDto,
} from './dto/promotion.dto';

@ApiTags('Admin / Promotions')
@ApiBearerAuth()
@Controller('admin/promotions')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminPromotionsController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List promotions with derived status and real redemption figures' })
  list(@Query() query: PromotionQueryDto) {
    return this.promotions.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate promotion performance derived from redeemed bookings' })
  summary(@Query() query: PromotionSummaryQueryDto) {
    return this.promotions.summary(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single promotion' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotions.findOne(id);
  }

  @Post()
  @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Create a promotion' })
  create(@Body() dto: CreatePromotionDto, @CurrentUser('id') adminId: string) {
    return this.promotions.create(dto, adminId);
  }

  @Patch(':id')
  @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Update a promotion' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.promotions.update(id, dto, adminId);
  }

  @Patch(':id/status')
  @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Activate or pause a promotion' })
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.promotions.setActive(id, dto.active, adminId);
  }

  @Delete(':id')
  @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS)
  @ApiOperation({ summary: 'Delete a promotion that has never been redeemed' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    return this.promotions.remove(id, adminId);
  }
}
