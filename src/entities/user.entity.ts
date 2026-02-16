import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Team } from './team.entity';
import { LeaveRequest } from './leave-request.entity';

export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR = 'hr',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({ nullable: true })
  teamId: string;

  @ManyToOne(() => Team, (team) => team.members, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @OneToMany(() => LeaveRequest, (leave) => leave.user)
  leaveRequests: LeaveRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}