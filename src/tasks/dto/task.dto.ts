import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsUUID,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement Swagger docs' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Add Swagger decorators and setup' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'uuid' } })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  assigneeIds: string[];

  @ApiProperty({ format: 'date', example: '2026-02-10' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Refine Swagger docs' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Add responses and security info' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'uuid' } })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({ format: 'date', example: '2026-03-01' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;
}
