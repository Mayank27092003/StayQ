import { Injectable, Logger } from '@nestjs/common';
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
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'stay-q';
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
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    };

    // Schedule time
    task.scheduleTime = {
      seconds: Math.max(scheduledTime.getTime() / 1000, Date.now() / 1000 + 10), // At least 10s in future
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          `Local Dev: Simulating Cloud Task creation to ${url} at ${scheduledTime.toISOString()}`,
        );
        // In local dev, we don't actually hit GCP unless configured
        return;
      }
      
      const [response] = await this.client.createTask({ parent, task });
      this.logger.log(`Created Cloud Task ${response.name}`);
    } catch (error) {
      this.logger.error(`Failed to schedule Cloud Task: ${error.message}`);
    }
  }
}
