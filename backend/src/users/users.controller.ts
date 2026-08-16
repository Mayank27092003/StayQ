import { Controller, Get, Put, Patch, Delete, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  async patchProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @UseGuards(FirebaseAuthGuard)
  async deleteMyAccount(@CurrentUser() user: User) {
    return this.usersService.deleteUser(user.id);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('me/kyc/submit')
  @UseGuards(FirebaseAuthGuard)
  async submitKyc(@CurrentUser() user: User) {
    return this.usersService.submitKyc(user.id);
  }
}
