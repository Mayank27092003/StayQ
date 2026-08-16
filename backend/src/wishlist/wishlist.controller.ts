import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(FirebaseAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':propertyId')
  add(@CurrentUser('id') userId: string, @Param('propertyId') propertyId: string) {
    return this.wishlistService.add(userId, propertyId);
  }

  @Delete(':propertyId')
  remove(@CurrentUser('id') userId: string, @Param('propertyId') propertyId: string) {
    return this.wishlistService.remove(userId, propertyId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.wishlistService.findAll(userId);
  }
}
