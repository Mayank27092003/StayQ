import { Controller, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { HostOnboardingService } from './host-onboarding.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('properties')
@UseGuards(FirebaseAuthGuard)
export class HostOnboardingController {
  constructor(private readonly onboardingService: HostOnboardingService) {}

  @Post('onboarding/draft')
  createDraft(@CurrentUser() user: any, @Body() data: any) {
    const hostId = user.id;
    return this.onboardingService.createDraft(hostId, data);
  }

  @Patch(':id/onboarding-step')
  updateStep(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    const hostId = user.id;
    return this.onboardingService.updateStep(id, hostId, data);
  }

  @Post(':id/rooms')
  setRooms(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    const hostId = user.id;
    return this.onboardingService.setRooms(id, hostId, body.rooms || []);
  }

  @Post(':id/submit')
  submitProperty(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    const hostId = user.id;
    return this.onboardingService.submitProperty(id, hostId);
  }
}
