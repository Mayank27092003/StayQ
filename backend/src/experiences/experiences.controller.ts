import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { CapacityEngineService } from './capacity-engine.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('experiences')
export class ExperiencesController {
  constructor(
    private readonly experiencesService: ExperiencesService,
    private readonly capacityEngine: CapacityEngineService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  create(@CurrentUser() user: any, @Body() createExperienceDto: any) {
    createExperienceDto.hostId = user.id;
    return this.experiencesService.create(createExperienceDto);
  }

  @Get()
  findAll(@Query('adminView') adminView?: string) {
    return this.experiencesService.findAll(adminView === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experiencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  update(@Param('id') id: string, @Body() updateExperienceDto: any) {
    return this.experiencesService.update(id, updateExperienceDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  remove(@Param('id') id: string) {
    return this.experiencesService.remove(id);
  }

  @Get(':id/slots')
  getSlots(@Param('id') id: string) {
    return this.experiencesService.findSlots(id);
  }

  @Post(':id/book-slot')
  @UseGuards(FirebaseAuthGuard)
  async bookSlot(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { slotId: string; quantity: number }) {
    const available = await this.capacityEngine.checkAvailability(body.slotId, body.quantity);
    if (!available) {
      throw new Error('Not enough capacity');
    }
    return this.capacityEngine.bookSlot(body.slotId, body.quantity, user.id);
  }
}
