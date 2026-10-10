import { Public } from '../common/decorators/public.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @Public()
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('adminView') adminView?: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
  ) {
    return this.experiencesService.findAll(adminView === 'true', user, {
      city,
      category,
    });
  }

  @Public()
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.experiencesService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateExperienceDto: any,
  ) {
    return this.experiencesService.update(id, updateExperienceDto, user);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.experiencesService.remove(id, user);
  }

  @Public()
  @Get(':id/slots')
  getSlots(@CurrentUser() user: any, @Param('id') id: string) {
    return this.experiencesService.findSlots(id, user);
  }

  @Post(':id/book-slot')
  @UseGuards(FirebaseAuthGuard)
  async bookSlot(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { slotId: string; quantity: number },
  ) {
    return this.capacityEngine.bookSlot(
      body.slotId,
      body.quantity,
      user.id,
      id,
    );
  }

  @Post(':id/release-slot')
  @UseGuards(FirebaseAuthGuard)
  async releaseSlot(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { slotId: string; quantity: number },
  ) {
    return this.capacityEngine.releaseSlot(body.slotId, body.quantity);
  }
}
