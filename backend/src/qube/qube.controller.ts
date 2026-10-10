import { Throttle } from '@nestjs/throttler';
import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { QubeService } from './qube.service';

@Public()
@Throttle({ ai: { limit: 15, ttl: 60000 } })
@Controller('qube')
export class QubeController {
  constructor(private readonly qubeService: QubeService) {}

  @Post('chat')
  async chat(
    @Body()
    body: {
      message: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    },
  ) {
    const reply = await this.qubeService.chat(body.message, body.history);
    return { reply };
  }

  @Post('plan')
  async generatePlan(@Body() body: { prompt: string; userLocation?: any }) {
    return this.qubeService.generatePlan(body.prompt, body.userLocation);
  }
}
