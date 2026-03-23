import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';
import { User, UserRole } from '../users/user.entity';
import { NotificationsQueueService } from '../notifications/notifications.queue.service';

describe('TasksService', () => {
  let service: TasksService;

  const rmqClient = {
    emit: jest.fn().mockReturnValue(of(undefined)),
  };

  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  } as unknown as DataSource;

  const taskRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<Task>;

  const userRepository = {} as Repository<User>;

  const notificationsQueueService = {
    enqueueTaskAssigned: jest.fn(),
  };

  beforeEach(() => {
    notificationsQueueService.enqueueTaskAssigned.mockResolvedValue(undefined);

    service = new TasksService(
      rmqClient as any,
      cacheManager as any,
      dataSource,
      taskRepository,
      userRepository,
      notificationsQueueService as unknown as NotificationsQueueService,
    );

    jest.clearAllMocks();
  });

  it('throws NotFoundException when task does not exist', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne('missing-task')).rejects.toThrow(NotFoundException);
  });

  it('returns cached tasks list when available', async () => {
    const cachedTasks = [{ id: 'task-cached' }] as Task[];
    cacheManager.get.mockResolvedValue(cachedTasks);

    const result = await service.findAll(TaskStatus.TODO, 'user-1', 'docs');

    expect(result).toEqual(cachedTasks);
    expect(taskRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('returns aggregated task stats grouped by status', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { status: TaskStatus.TODO, count: '2' },
        { status: TaskStatus.IN_PROGRESS, count: '3' },
        { status: TaskStatus.DONE, count: '1' },
      ]),
    };

    (taskRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

    const stats = await service.getTaskStats();

    expect(stats).toEqual({
      total: 6,
      todo: 2,
      inProgress: 3,
      done: 1,
    });
  });

  it('enqueues assignment notification when creating an assigned task', async () => {
    const createdTask = {
      id: 'task-10',
      title: 'Queue notification test',
      description: 'Ensure assignment job is queued',
      status: TaskStatus.TODO,
      createdAt: new Date('2026-03-23T12:00:00.000Z'),
      assignees: [{ id: 'user-1' }, { id: 'user-2' }],
    } as unknown as Task;

    (dataSource.transaction as jest.Mock).mockResolvedValue(createdTask);
    cacheManager.clear.mockResolvedValue(true);
    notificationsQueueService.enqueueTaskAssigned.mockResolvedValue(undefined);

    const result = await service.create({
      title: 'Queue notification test',
      description: 'Ensure assignment job is queued',
      dueDate: '2026-03-24',
      assigneeIds: ['user-1', 'user-2'],
    });

    expect(result.id).toBe('task-10');
    expect(notificationsQueueService.enqueueTaskAssigned).toHaveBeenCalledWith({
      taskId: 'task-10',
      title: 'Queue notification test',
      assigneeIds: ['user-1', 'user-2'],
      source: 'create',
    });
    expect(cacheManager.clear).toHaveBeenCalled();
  });

  it('prevents members from updating fields other than status', async () => {
    const existingTask = {
      id: 'task-1',
      title: 'Initial',
      description: 'Initial',
      status: TaskStatus.TODO,
      assignees: [],
    } as Task;

    (taskRepository.findOne as jest.Mock).mockResolvedValue(existingTask);

    await expect(
      service.update(
        'task-1',
        {
          title: 'Changed title',
          status: TaskStatus.DONE,
        },
        {
          id: 'member-1',
          role: UserRole.MEMBER,
        } as User,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates status and returns task with assignee id projection', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    cacheManager.clear.mockResolvedValue(true);

    const existingTask = {
      id: 'task-2',
      title: 'Build tests',
      description: 'Write useful unit specs',
      status: TaskStatus.TODO,
      assignees: [
        {
          id: 'user-22',
          email: 'member@example.com',
          name: 'Member',
          role: UserRole.MEMBER,
        },
      ],
    } as Task;

    (taskRepository.findOne as jest.Mock).mockResolvedValue(existingTask);
    (taskRepository.save as jest.Mock).mockImplementation(async (task: Task) => task);

    const result = await service.updateStatus('task-2', {
      status: TaskStatus.DONE,
    });

    expect(taskRepository.save).toHaveBeenCalled();
    expect(cacheManager.clear).toHaveBeenCalled();
    expect(result.status).toBe(TaskStatus.DONE);
    expect(result.assignees).toEqual([{ id: 'user-22' }]);
  });

  it('deletes an existing task', async () => {
    cacheManager.get.mockResolvedValue(undefined);
    cacheManager.clear.mockResolvedValue(true);

    const existingTask = {
      id: 'task-3',
      title: 'Cleanup',
      description: 'Remove old code',
      status: TaskStatus.TODO,
      assignees: [],
    } as Task;

    (taskRepository.findOne as jest.Mock).mockResolvedValue(existingTask);
    (taskRepository.remove as jest.Mock).mockResolvedValue(existingTask);

    await service.delete('task-3');

    expect(taskRepository.remove).toHaveBeenCalledWith(existingTask);
    expect(cacheManager.clear).toHaveBeenCalled();
  });
});
