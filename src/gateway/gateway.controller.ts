import {
  Controller,
  Get,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { TaskStatus } from '../tasks/task.entity';

@ApiTags('gateway')
@Controller('gateway')
export class GatewayController {
  constructor(
    @Inject('TASKS_RMQ_CLIENT')
    private readonly rmqClient: ClientProxy,
  ) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Gateway proxy: fetch tasks via RMQ message pattern' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getTasks(
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    try {
      return await firstValueFrom(
        this.rmqClient.send('get_tasks', {
          status,
          assigneeId,
          search,
        }).pipe(timeout(3000)),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new GatewayTimeoutException('Task service timeout');
      }

      throw new HttpException('Task service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
