import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  NOTIFICATIONS_QUEUE,
  TASK_ASSIGNED_JOB,
  TaskAssignedJobPayload,
} from './notifications.types';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<TaskAssignedJobPayload>): Promise<void> {
    if (job.name !== TASK_ASSIGNED_JOB) {
      this.logger.warn(`Unsupported job type received: ${job.name}`);
      return;
    }

    this.logger.log(
      `Processing ${TASK_ASSIGNED_JOB} for task ${job.data.taskId} with ${job.data.assigneeIds.length} assignees`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TaskAssignedJobPayload>): void {
    this.logger.log(`Job completed: ${job.id} (${job.name})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TaskAssignedJobPayload> | undefined, error: Error): void {
    this.logger.error(
      `Job failed: ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}) - ${error.message}`,
    );
  }
}
