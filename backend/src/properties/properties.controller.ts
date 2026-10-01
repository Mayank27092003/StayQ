import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyCategory, PropertyType } from '@prisma/client';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  create(@CurrentUser() user: any, @Body() createPropertyDto: any) {
    if (user) {
      createPropertyDto.hostId = user.id;
    }
    return this.propertiesService.create(createPropertyDto);
  }

  @Post('onboarding/draft')
  @UseGuards(FirebaseAuthGuard)
  createDraft(@CurrentUser() user: any, @Body() createPropertyDto: any) {
    if (user) {
      createPropertyDto.hostId = user.id;
    }
    return this.propertiesService.create(createPropertyDto);
  }

  @Post(':id/submit')
  @UseGuards(FirebaseAuthGuard)
  submitListing(@Param('id') id: string) {
    return this.propertiesService.update(id, { status: 'PENDING_REVIEW' });
  }

  @Get()
  findAll(@Query('adminView') adminView?: string) {
    return this.propertiesService.findAll(adminView === 'true');
  }

  @Get('host/me')
  @UseGuards(FirebaseAuthGuard)
  async findMyProperties(@CurrentUser() user: any) {
    return this.propertiesService.findByHostIdOrFirebaseUid(user.id);
  }

  @Get('host/:hostId')
  async findByHostId(@Param('hostId') hostId: string) {
    return this.propertiesService.findByHostIdOrFirebaseUid(hostId);
  }

  @Get('search')
  search(@Query('city') city: string, @Query('category') category: PropertyCategory) {
    return this.propertiesService.search(city, category);
  }

  @Get('type/:type')
  findByType(@Param('type') type: PropertyType) {
    return this.propertiesService.findByType(type);
  }

  @Get('map')
  findByRadius(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.propertiesService.findByRadius(Number(lat), Number(lng), Number(radius));
  }

  @Get(':id/exact-location')
  @UseGuards(FirebaseAuthGuard)
  getExactLocation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.propertiesService.getExactLocation(id, userId);
  }

  @Get('lookup/code/:code')
  lookupByCode(@Param('code') code: string) {
    return this.propertiesService.lookupByCode(code);
  }

  @Post(':id/incidents')
  @UseGuards(FirebaseAuthGuard)
  createIncident(@Param('id') id: string, @Body() incidentDto: any) {
    return this.propertiesService.createIncident(id, incidentDto);
  }

  @Patch('incidents/:incidentId/status')
  @UseGuards(FirebaseAuthGuard)
  updateIncidentStatus(
    @Param('incidentId') incidentId: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.propertiesService.updateIncidentStatus(incidentId, body.status, body.notes);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('adminView') adminView?: string) {
    return this.propertiesService.findOne(id, adminView === 'true');
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updatePropertyDto: any) {
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
    @Body('blockedDates') blockedDates: { startDate: string; endDate: string }[]
  ) {
    return this.propertiesService.addAvailabilityBlocks(id, blockedDates, user);
  }
}
