import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole, FeaturedPlacementType } from '@prisma/client';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../guards/admin.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminRoles } from '../decorators/admin-roles.decorator';
import { AdminFeaturedService } from './admin-featured.service';
import { BannerQueryDto, CreateBannerDto, CreateFeaturedPlacementDto, FeaturedQueryDto, ReorderFeaturedDto, UpdateBannerDto, UpdateFeaturedPlacementDto } from './dto/featured.dto';
import { IsEnum } from 'class-validator';

@ApiTags('Admin / Featured')
@ApiBearerAuth()
@Controller('admin/featured')
@UseGuards(FirebaseAuthGuard, AdminGuard, AdminRolesGuard)
export class AdminFeaturedController {
  constructor(private readonly featured: AdminFeaturedService) {}

  @Get('placements') listPlacements(@Query() q: FeaturedQueryDto) { return this.featured.listPlacements(q); }
  @Post('placements') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) createPlacement(@Body() dto: CreateFeaturedPlacementDto, @CurrentUser('id') id: string) { return this.featured.createPlacement(dto, id); }
  @Patch('placements/:id') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) updatePlacement(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeaturedPlacementDto, @CurrentUser('id') adminId: string) { return this.featured.updatePlacement(id, dto, adminId); }
  @Delete('placements/:id') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) deletePlacement(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.featured.deletePlacement(id, adminId); }
  @Put('placements/:placement/order') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) reorder(@Param('placement') placement: string, @Body() dto: ReorderFeaturedDto, @CurrentUser('id') adminId: string) { return this.featured.reorderPlacements(placement as FeaturedPlacementType, dto, adminId); }

  @Get('banners') listBanners(@Query() q: BannerQueryDto) { return this.featured.listBanners(q); }
  @Post('banners') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) createBanner(@Body() dto: CreateBannerDto, @CurrentUser('id') id: string) { return this.featured.createBanner(dto, id); }
  @Patch('banners/:id') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) updateBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto, @CurrentUser('id') adminId: string) { return this.featured.updateBanner(id, dto, adminId); }
  @Delete('banners/:id') @AdminRoles(AdminRole.MARKETING, AdminRole.OPERATIONS) deleteBanner(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) { return this.featured.deleteBanner(id, adminId); }
}
