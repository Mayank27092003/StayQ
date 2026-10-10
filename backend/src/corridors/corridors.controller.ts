import { Public } from '../common/decorators/public.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CorridorsService } from './corridors.service';
import { CorridorRegion } from '@prisma/client';

@Public()
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

  @Post()
  async create(@Body() body: any) {
    return this.corridorsService.createCorridor(body);
  }
}

