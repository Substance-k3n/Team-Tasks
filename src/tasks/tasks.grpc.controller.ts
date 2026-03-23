import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { INTERNAL_GRPC_SERVICE } from '../grpc/grpc.constants';

interface GetTaskStatsRequest {}

interface GetTaskStatsResponse {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

@Controller()
export class TasksGrpcController {
  constructor(private readonly tasksService: TasksService) {}

  @GrpcMethod(INTERNAL_GRPC_SERVICE, 'GetTaskStats')
  async getTaskStats(_payload: GetTaskStatsRequest): Promise<GetTaskStatsResponse> {
    return this.tasksService.getTaskStats();
  }
}
