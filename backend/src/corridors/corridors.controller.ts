import { Controller, Get, Param, Query } from '@nestjs/common';
import { CorridorsService } from './corridors.service';
import { CorridorRegion } from '@prisma/client';

@Controller('corridors')
export class CorridorsController {
  constructor(private readonly corridorsService: CorridorsService) {}

  @Get()
  async findAll(@Query('region') region?: CorridorRegion) {
    return this.corridorsService.findAll(region);
  }

  @Get('regions')
  async getGroupedByRegion() {
    return this.corridorsService.getGroupedByRegion();
  }

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.corridorsService.findBySlugOrId(idOrSlug);
  }
}
