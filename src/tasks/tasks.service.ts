import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(
    status?: TaskStatus,
    assigneeId?: string,
    search?: string,
  ): Promise<Task[]> {
    const query = this.taskRepository.createQueryBuilder('task');
    query.leftJoinAndSelect('task.assignees', 'assignees');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (assigneeId) {
      query.andWhere('assignees.id = :assigneeId', { assigneeId });
    }

    query.orderBy('task.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: { assignees: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { assigneeIds, assigneeId, ...taskData } = createTaskDto;
    
    const ids = assigneeIds ?? (assigneeId ? [assigneeId] : []);
    
    let assignees: User[] = [];
    if (ids.length > 0) {
      assignees = await this.userRepository.findBy({ id: In(ids) });
      
      if (assignees.length !== ids.length) {
        throw new NotFoundException('One or more assignees not found');
      }
    }

    const task = this.taskRepository.create({
      ...taskData,
      assignees,
    });

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

    if ((updateTaskDto as any).assigneeIds) {
      task.assignees = (updateTaskDto as any).assigneeIds.map((id: string) => ({ id } as User));
      // Remove the field so Object.assign doesn't overwrite relations incorrectly
      delete (updateTaskDto as any).assigneeIds;
    }

    if ((updateTaskDto as any).assigneeId) {
      task.assignees = [{ id: (updateTaskDto as any).assigneeId } as User];
      delete (updateTaskDto as any).assigneeId;
    }

    Object.assign(task, updateTaskDto);
    const saved = await this.taskRepository.save(task);

    return this.toTaskWithAssigneeIds(saved);
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<Task> {
    const task = await this.findOne(id);
    task.status = updateTaskStatusDto.status;
    const saved = await this.taskRepository.save(task);

    return this.toTaskWithAssigneeIds(saved);
  }

  async delete(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  private toTaskWithAssigneeIds(task: Task): Task {
    return {
      ...task,
      assignees: task.assignees?.map((assignee) => ({ id: assignee.id } as User)) ?? [],
    };
  }
}
