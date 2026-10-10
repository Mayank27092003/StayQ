import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CloudTasksClient } from '@google-cloud/tasks';

@Injectable()
export class CloudTasksService {
  private client: CloudTasksClient;
  private readonly logger = new Logger(CloudTasksService.name);

  constructor() {
    this.client = new CloudTasksClient();
  }

  /**
   * Schedules a webhook to be called in the future using Google Cloud Tasks.
   * This replaces BullMQ/Redis with a fully serverless approach.
   */
  async scheduleWebhook(
    url: string,
    payload: any,
    scheduledTime: Date,
  ): Promise<void> {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (
      !project ||
      !process.env.CLOUD_TASKS_SECRET ||
      process.env.CLOUD_TASKS_SECRET.length < 32
    )
      throw new ServiceUnavailableException('Cloud Tasks is not configured');
    const queue = process.env.CLOUD_TASKS_QUEUE || 'default';
    const location = process.env.CLOUD_TASKS_LOCATION || 'asia-south1';

    // Cloud Tasks requires the fully qualified queue name
    const parent = this.client.queuePath(project, location, queue);

    const task: any = {
      httpRequest: {
        httpMethod: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'x-stayq-task-secret': process.env.CLOUD_TASKS_SECRET,
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    };

    // Schedule time
    task.scheduleTime = {
      seconds: Math.floor(
        Math.max(scheduledTime.getTime() / 1000, Date.now() / 1000 + 10),
      ), // At least 10s in future
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          `Local Dev: Simulating Cloud Task creation to ${url} at ${scheduledTime.toISOString()}`,
        );
        // In local dev, we don't actually hit GCP unless configured
        throw new ServiceUnavailableException(
          'Cloud Tasks delivery is disabled in development',
        );
      }

      const [response] = await this.client.createTask({ parent, task });
      this.logger.log(`Created Cloud Task ${response.name}`);
    } catch (error) {
      throw new ServiceUnavailableException('Cloud Task scheduling failed');
    }
  }
}
