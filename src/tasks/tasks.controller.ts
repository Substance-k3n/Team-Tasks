import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole, User } from '../users/users.entity';
import { Task, TaskStatus } from './task.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assigneeId', required: false, description: 'Filter by assignee UUID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title or description' })
  @ApiOkResponse({ type: Task, isArray: true })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    return this.tasksService.findAll(status, assigneeId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by id' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiOkResponse({ type: Task })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create task (admin only)' })
  @ApiBody({ type: CreateTaskDto })
  @ApiCreatedResponse({ type: Task })
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiOkResponse({ type: Task })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete task (admin only)' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Task deleted successfully' } },
    },
  })
  async delete(@Param('id') id: string) {
    await this.tasksService.delete(id);
    return { message: 'Task deleted successfully' };
  }
}
