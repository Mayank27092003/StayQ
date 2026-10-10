import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Public } from '../common/decorators/public.decorator';
import { JobsService } from './jobs.service';
@Controller('webhooks/jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}
  @Public()
  @Post('run')
  run(@Headers('x-stayq-task-secret') value: string) {
    const secret = process.env.CLOUD_TASKS_SECRET;
    if (
      !secret ||
      secret.length < 32 ||
      !value ||
      Buffer.byteLength(value) !== Buffer.byteLength(secret) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(value))
    )
      throw new UnauthorizedException('Invalid job authentication');
    return this.jobs.run();
  }
}
