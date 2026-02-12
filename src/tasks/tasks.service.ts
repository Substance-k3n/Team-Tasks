import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(
    status?: TaskStatus,
    assigneeId?: string,
    search?: string,
  ): Promise<Task[]> {
    const query = this.taskRepository.createQueryBuilder('task');
    query.leftJoinAndSelect('task.assignee', 'assignee');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    if (search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('task.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id);

    // Members can only update status
    if (user.role === UserRole.MEMBER) {
      if (Object.keys(updateTaskDto).length > 1 || !updateTaskDto.status) {
        throw new ForbiddenException('Members can only update task status');
      }
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const task = await this.findOne(id);
    task.status = updateTaskStatusDto.status;
    return this.taskRepository.save(task);
  }

  async delete(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }
}
