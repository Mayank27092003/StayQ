import { Controller, Post, Put, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SyncProfileDto } from './dto/sync-profile.dto';
@Controller('auth')
@UseGuards(FirebaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('send-email-otp')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  sendEmailOtp(
    @Body() body: { email: string; userName?: string },
    @CurrentUser() user: any,
  ) {
    return this.authService.sendEmailOtp(body.email, body.userName, user.id);
  }
  @Post('verify-email-otp')
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  verifyEmailOtp(
    @Body() body: { email: string; otp: string },
    @CurrentUser() user: any,
  ) {
    return this.authService.verifyEmailOtp(body.email, body.otp, user.id);
  }
  @Put('sync-profile')
  syncProfile(@CurrentUser() user: any, @Body() dto: SyncProfileDto) {
    return this.authService.syncProfile(user.id, dto);
  }
  @Post('become-host')
  becomeHost(@CurrentUser() user: any) {
    return this.authService.becomeHost(user.id);
  }
}
