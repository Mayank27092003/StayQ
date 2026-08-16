import { Controller, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('disputes')
@UseGuards(FirebaseAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  raiseDispute(@Body() createDisputeDto: any) {
    return this.disputesService.raiseDispute(createDisputeDto);
  }

  @Patch(':id/resolve')
  resolveDispute(@Param('id') id: string, @Body() resolveDto: any) {
    return this.disputesService.resolveDispute(id, resolveDto);
  }
}
