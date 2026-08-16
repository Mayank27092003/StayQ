import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsRangeQueryDto, TopListQueryDto } from './dto/analytics.dto';

@ApiTags('Admin / Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform counters and settled revenue for a window' })
  overview(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.overview(query);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Booking, revenue, and signup series with a continuous axis' })
  timeseries(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.timeseries(query);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Realised booking distribution by category, city, and property type' })
  breakdown(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.breakdown(query);
  }

  @Get('top-properties')
  @ApiOperation({ summary: 'Highest-earning properties in the window' })
  topProperties(@Query() query: TopListQueryDto) {
    return this.analytics.topProperties(query);
  }

  @Get('top-hosts')
  @ApiOperation({ summary: 'Highest-earning hosts in the window' })
  topHosts(@Query() query: TopListQueryDto) {
    return this.analytics.topHosts(query);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Recent platform activity events' })
  recentActivity() {
    return this.analytics.recentActivity();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue detail including refunds and the payout pipeline' })
  revenue(@Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.revenue(query);
  }
}
