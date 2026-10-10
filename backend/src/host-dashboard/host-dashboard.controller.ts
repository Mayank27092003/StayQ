import { isOperationsAdmin } from '../common/authorization.util';
import { PropertiesService } from '../properties/properties.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { HostDashboardService } from './host-dashboard.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller(['host-dashboard', 'host'])
@UseGuards(FirebaseAuthGuard)
export class HostDashboardController {
  constructor(
    private readonly hostDashboardService: HostDashboardService,
    private readonly properties: PropertiesService,
  ) {}

  @Get(':hostId')
  async getDashboardData(
    @CurrentUser() user: any,
    @Param('hostId') hostId: string,
  ) {
    if (
      user.id !== hostId &&
      user.firebaseUid !== hostId &&
      !isOperationsAdmin(user)
    ) {
      throw new ForbiddenException('Access denied to host dashboard');
    }
    return this.hostDashboardService.getDashboardData(hostId);
  }

  @Post('availability')
  updateAvailability(@CurrentUser() user: any, @Body() body: any) {
    return this.properties.setAvailability(body.propertyId, body, user);
  }
}
