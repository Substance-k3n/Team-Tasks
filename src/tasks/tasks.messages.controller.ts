import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';

interface GetTasksRequest {
  status?: TaskStatus;
  assigneeId?: string;
  search?: string;
}

@Controller()
export class TasksMessagesController {
  private readonly logger = new Logger(TasksMessagesController.name);

  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern('get_tasks')
  async handleGetTasks(
    @Payload() payload: GetTasksRequest,
    @Ctx() context: RmqContext,
  ) {
    try {
      const result = await this.tasksService.findAll(
        payload?.status,
        payload?.assigneeId,
        payload?.search,
      );

      this.ack(context);
      return result;
    } catch (error) {
      this.reject(context, false);
      throw error;
    }
  }

  @EventPattern('task_created')
  handleTaskCreated(@Payload() payload: unknown, @Ctx() context: RmqContext): void {
    try {
      this.logger.log(`Consumed event task_created: ${JSON.stringify(payload)}`);
      this.ack(context);
    } catch (error) {
      this.logger.error(
        `Failed to consume task_created event: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.reject(context, true);
    }
  }

  private ack(context: RmqContext): void {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    channel.ack(message);
  }

  private reject(context: RmqContext, requeue: boolean): void {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    channel.nack(message, false, requeue);
  }
}
