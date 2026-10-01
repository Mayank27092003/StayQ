import { Controller, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('disputes')
@UseGuards(FirebaseAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  raiseDispute(@CurrentUser('id') userId: string, @Body() createDisputeDto: any) {
    createDisputeDto.raisedBy = userId;
    return this.disputesService.raiseDispute(createDisputeDto);
  }

  @Patch(':id/resolve')
  @UseGuards(AdminGuard)
  resolveDispute(@Param('id') id: string, @Body() resolveDto: any) {
    return this.disputesService.resolveDispute(id, resolveDto);
  }
}
