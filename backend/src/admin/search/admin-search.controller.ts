import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminSearchService } from './admin-search.service';

@ApiTags('Admin / Universal Search')
@ApiBearerAuth()
@Controller('admin/search')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminSearchController {
  constructor(private readonly searchService: AdminSearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Universal search across users, hosts, transactions, properties, and bookings by phone or email',
  })
  async search(
    @Query('q') q: string,
    @Query('type') type?: string,
  ) {
    return this.searchService.search(q, type || 'all');
  }
}
