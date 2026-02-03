import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/users.entity';

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

  // Relationship: Many tasks belong to one user (assignee)
  // eager: true prevents N+1 queries by automatically loading assignee
  @ManyToOne(() => User, (user) => user.tasks, { eager: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ApiProperty({ format: 'uuid' })
  @Column()
  assigneeId: string;
}