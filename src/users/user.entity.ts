import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Task } from '../tasks/task.entity';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'password123', writeOnly: true })
  @Column({ nullable: true })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEMBER })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
    nullable: true
  })
  role: UserRole;

  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];
}
