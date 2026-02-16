import {
  IsEnum,
  IsDateString,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { LeaveType, LeaveStatus } from '../../entities/leave-request.entity';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateLeaveDto {
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  managerComment?: string;
}

export class ListLeavesQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class LeaveResponseDto {
  id: string;
  userId: string;
  userName: string;
  teamName: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string;
  managerComment: string;
  createdAt: Date;
  updatedAt: Date;
}