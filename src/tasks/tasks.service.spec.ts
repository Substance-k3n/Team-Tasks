import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';
import { User, UserRole } from '../users/user.entity';

describe('TasksService', () => {
  let service: TasksService;

  const rmqClient = {
    emit: jest.fn().mockReturnValue(of(undefined)),
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

  beforeEach(() => {
    service = new TasksService(
      rmqClient as any,
      dataSource,
      taskRepository,
      userRepository,
    );

    jest.clearAllMocks();
  });

  it('throws NotFoundException when task does not exist', async () => {
    (taskRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne('missing-task')).rejects.toThrow(NotFoundException);
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
    expect(result.status).toBe(TaskStatus.DONE);
    expect(result.assignees).toEqual([{ id: 'user-22' }]);
  });

  it('deletes an existing task', async () => {
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
  });
});
