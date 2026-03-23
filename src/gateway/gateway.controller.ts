import {
  Controller,
  Get,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout, TimeoutError } from 'rxjs';
import { TaskStatus } from '../tasks/task.entity';
import {
  INTERNAL_GRPC_SERVICE,
} from '../grpc/grpc.constants';

interface InternalTaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

interface InternalTaskServiceGrpc {
  getTaskStats(payload: Record<string, never>): Observable<InternalTaskStats>;
}

@ApiTags('gateway')
@Controller('gateway')
export class GatewayController implements OnModuleInit {
  private internalTaskService?: InternalTaskServiceGrpc;

  constructor(
    @Inject('TASKS_RMQ_CLIENT')
    private readonly rmqClient: ClientProxy,
    @Inject('INTERNAL_TASKS_GRPC_CLIENT')
    private readonly internalGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.internalTaskService =
      this.internalGrpcClient.getService<InternalTaskServiceGrpc>(
        INTERNAL_GRPC_SERVICE,
      );
  }

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

  @Get('tasks/stats-grpc')
  @ApiOperation({ summary: 'Gateway proxy: fetch task stats via internal gRPC service' })
  async getTaskStatsViaGrpc() {
    if (!this.internalTaskService) {
      throw new HttpException('gRPC client is not initialized', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      return await firstValueFrom(
        this.internalTaskService.getTaskStats({}).pipe(timeout(3000)),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new GatewayTimeoutException('Internal gRPC service timeout');
      }

      throw new HttpException(
        'Internal gRPC service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
