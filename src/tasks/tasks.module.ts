import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksMessagesController } from './tasks.messages.controller';
import { TasksGrpcController } from './tasks.grpc.controller';
import { RmqClientModule } from '../messaging/rmq.client.module';
import { NotificationsModule } from '../notifications/notifications.module';

const isJestRuntime =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

@Module({
	imports: [
		TypeOrmModule.forFeature([Task, User]),
		RmqClientModule,
		...(!isJestRuntime ? [NotificationsModule] : []),
	],
	controllers: [TasksController, TasksMessagesController, TasksGrpcController],
	providers: [TasksService],
	exports: [TasksService],
})
export class TasksModule {}
