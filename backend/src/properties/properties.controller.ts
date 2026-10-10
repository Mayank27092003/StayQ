import { isOperationsAdmin } from '../common/authorization.util';
import { Public } from '../common/decorators/public.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PropertiesService } from './properties.service';
import { CalendarSyncService } from './calendar-sync.service';
import { PropertyCategory, PropertyType } from '@prisma/client';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.propertiesService.create(dto, user);
  }

  @Public()
  @Get()
  @UseGuards(FirebaseAuthGuard)
  findAll(@Query('adminView') view?: string, @Req() req?: any) {
    return this.propertiesService.findAll(
      view === 'true' && isOperationsAdmin(req?.user),
    );
  }

  @Get('host/me')
  @UseGuards(FirebaseAuthGuard)
  findMyProperties(@CurrentUser() user: any) {
    return this.propertiesService.findByHostIdOrFirebaseUid(user.id, user);
  }

  @Public()
  @Get('host/:hostId')
  @UseGuards(FirebaseAuthGuard)
  findByHostId(@Param('hostId') id: string, @CurrentUser() user: any) {
    const targetId = id === 'me' ? user?.id : id;
    if (!targetId) return [];
    return this.propertiesService.findByHostIdOrFirebaseUid(targetId, user);
  }

  @Public()
  @Get('search')
  search(
    @Query('city') city?: string,
    @Query('category') category?: PropertyCategory,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('guests') guests?: string,
  ) {
    return this.propertiesService.search(
      city,
      category,
      checkIn,
      checkOut,
      guests ? Number(guests) : undefined,
    );
  }

  @Public()
  @Get('type/:type')
  findByType(@Param('type') type: PropertyType) {
    return this.propertiesService.findByType(type);
  }

  @Public()
  @Get('map')
  findByRadius(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.propertiesService.findByRadius(
      Number(lat),
      Number(lng),
      Number(radius),
    );
  }

  @Get(':id/exact-location')
  @UseGuards(FirebaseAuthGuard)
  getExactLocation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.propertiesService.getExactLocation(id, userId);
  }

  @Public()
  @Get('lookup/code/:code')
  lookupByCode(@Param('code') code: string) {
    return this.propertiesService.lookupByCode(code);
  }

  @Post(':id/incidents')
  @UseGuards(FirebaseAuthGuard)
  createIncident(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.createIncident(id, dto, user);
  }

  @Patch('incidents/:incidentId/status')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  updateIncidentStatus(@Param('incidentId') id: string, @Body() body: any) {
    return this.propertiesService.updateIncidentStatus(
      id,
      body.status,
      body.notes,
    );
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('adminView') view?: string,
    @CurrentUser() user?: any,
  ) {
    return this.propertiesService.findOne(id, view === 'true', user);
  }

  @Put(':id')
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updatePropertyDto: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.propertiesService.remove(id, user);
  }

  @Post(':id/availability')
  @UseGuards(FirebaseAuthGuard)
  addAvailabilityBlocks(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('blockedDates')
    blockedDates: { startDate: string; endDate: string }[],
  ) {
    return this.propertiesService.addAvailabilityBlocks(id, blockedDates, user);
  }

  @Get(':id/calendar.ics')
  @UseGuards(FirebaseAuthGuard)
  async exportCalendar(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: any,
  ) {
    await this.propertiesService.findOne(id, true, user);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="stayq-calendar.ics"',
    );
    return res.send(await this.calendarSyncService.generateIcal(id));
  }

  @Post(':id/sync-calendar')
  @UseGuards(FirebaseAuthGuard)
  async syncCalendar(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('icalUrl') icalUrl: string,
  ) {
    const prop = await this.propertiesService.findOne(id, true, user);
    if (!prop) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }
    if (prop.hostId !== user.id && !isOperationsAdmin(user)) {
      throw new ForbiddenException(
        'Only the property host can synchronize external calendars',
      );
    }
    return this.calendarSyncService.syncIcal(id, icalUrl);
  }
}
