import { Controller, Post, Body, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SyncProfileDto } from './dto/sync-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}



  @Put('sync-profile')
  @UseGuards(FirebaseAuthGuard)
  async syncProfile(@CurrentUser() user: User, @Body() dto: SyncProfileDto) {
    return this.authService.syncProfile(user.id, dto);
  }

  @Post('become-host')
  @UseGuards(FirebaseAuthGuard)
  async becomeHost(@CurrentUser() user: User) {
    return this.authService.becomeHost(user.id);
  }
}
