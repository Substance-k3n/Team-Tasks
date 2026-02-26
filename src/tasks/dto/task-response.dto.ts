import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task.entity';
import { UserRole } from '../../users/user.entity';

export class AssigneeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEMBER })
  role: UserRole;
}

export class AssigneeIdDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
}

export class TaskWithAssigneesDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Implement Swagger docs' })
  title: string;

  @ApiProperty({ example: 'Add Swagger decorators and setup' })
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ format: 'date', example: '2026-02-10' })
  dueDate: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: [AssigneeDto] })
  assignees: AssigneeDto[];
}

export class TaskWithAssigneeIdsDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Implement Swagger docs' })
  title: string;

  @ApiProperty({ example: 'Add Swagger decorators and setup' })
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ format: 'date', example: '2026-02-10' })
  dueDate: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: [AssigneeIdDto] })
  assignees: AssigneeIdDto[];
}
