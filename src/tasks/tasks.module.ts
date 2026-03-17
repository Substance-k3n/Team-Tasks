import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksMessagesController } from './tasks.messages.controller';
import { RmqClientModule } from '../messaging/rmq.client.module';

@Module({
	imports: [TypeOrmModule.forFeature([Task, User]), RmqClientModule],
	controllers: [TasksController, TasksMessagesController],
	providers: [TasksService],
	exports: [TasksService],
})
export class TasksModule {}
