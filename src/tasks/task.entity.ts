import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('tasks')
export class Task {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Implement Swagger docs' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Add Swagger decorators and setup' })
  @Column('text')
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @ApiProperty({ format: 'date', example: '2026-02-10' })
  @Column({ type: 'date' })
  dueDate: Date;

  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship: Many tasks can have many assignees (users)
  // eager: true prevents N+1 queries by automatically loading assignees
  @ManyToMany(() => User, (user) => user.tasks, { eager: true })
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  assignees: User[];
}