import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from './task.entity';
import { UserRole } from '../users/user.entity';

describe('TasksController', () => {
  let controller: TasksController;

  const tasksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    jest.clearAllMocks();
  });

  it('delegates findAll filters to the service', async () => {
    tasksService.findAll.mockResolvedValue([{ id: 'task-1' }]);

    await controller.findAll(TaskStatus.TODO, 'user-1', 'setup');

    expect(tasksService.findAll).toHaveBeenCalledWith(
      TaskStatus.TODO,
      'user-1',
      'setup',
    );
  });

  it('delegates create to service', async () => {
    const dto = {
      title: 'Write tests',
      description: 'Cover service and guard logic',
      dueDate: '2026-03-25',
    };
    tasksService.create.mockResolvedValue({ id: 'task-2', ...dto });

    await controller.create(dto);

    expect(tasksService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update and forwards authenticated user', async () => {
    const dto = { status: TaskStatus.DONE };
    const user = {
      id: 'user-1',
      role: UserRole.ADMIN,
    };
    tasksService.update.mockResolvedValue({ id: 'task-3', ...dto });

    await controller.update('task-3', dto, user as any);

    expect(tasksService.update).toHaveBeenCalledWith('task-3', dto, user);
  });

  it('returns success message when delete completes', async () => {
    tasksService.delete.mockResolvedValue(undefined);

    const result = await controller.delete('task-9');

    expect(tasksService.delete).toHaveBeenCalledWith('task-9');
    expect(result).toEqual({ message: 'Task deleted successfully' });
  });
});
