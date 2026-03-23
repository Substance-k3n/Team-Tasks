import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATIONS_QUEUE,
  TASK_ASSIGNED_JOB,
  TaskAssignedJobPayload,
} from './notifications.types';

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<TaskAssignedJobPayload>,
  ) {}

  async enqueueTaskAssigned(payload: TaskAssignedJobPayload): Promise<void> {
    const job = await this.notificationsQueue.add(TASK_ASSIGNED_JOB, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    this.logger.log(
      `Enqueued ${TASK_ASSIGNED_JOB} job ${job.id} for task ${payload.taskId}`,
    );
  }
}
