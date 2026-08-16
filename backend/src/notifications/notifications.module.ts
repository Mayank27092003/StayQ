import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketGeneratorService } from './ticket-generator.service';
import { CloudTasksService } from './cloud-tasks.service';
import { WebhooksController } from './webhooks.controller';
import { EmailService } from './email.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, WebhooksController],
  providers: [
    NotificationsService,
    TicketGeneratorService,
    CloudTasksService,
    EmailService,
  ],
  exports: [
    NotificationsService,
    TicketGeneratorService,
    CloudTasksService,
    EmailService,
  ],
})
export class NotificationsModule {}
