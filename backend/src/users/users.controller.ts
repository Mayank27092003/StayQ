import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(['profile', 'me'])
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Put(['profile', 'me'])
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch(['profile', 'me'])
  async patchProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  async deleteMyAccount(@CurrentUser() user: User, @Req() req: any) {
    if (
      !req.firebaseUser?.auth_time ||
      Date.now() / 1000 - req.firebaseUser.auth_time > 300
    )
      throw new UnauthorizedException(
        'Recent sign-in is required to delete an account',
      );
    return this.usersService.deleteUser(user.id);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    if (user.id !== id && !(user.isAdmin && user.adminRole === 'SUPER_ADMIN'))
      throw new ForbiddenException('Cannot delete another account');
    if (
      !req.firebaseUser?.auth_time ||
      Date.now() / 1000 - req.firebaseUser.auth_time > 300
    )
      throw new UnauthorizedException('Recent sign-in is required');
    return this.usersService.deleteUser(id);
  }

  @Post('me/kyc/submit')
  async submitKyc(@CurrentUser() user: User) {
    return this.usersService.submitKyc(user.id);
  }

  @Post('become-host')
  async becomeHost(@CurrentUser() user: User) {
    return this.usersService.submitKyc(user.id);
  }
}
