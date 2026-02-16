import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserRole, User } from '../users/user.entity';
import { Task, TaskStatus } from './task.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with optional filtering' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus, description: 'Filter by task status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title or description' })
  @ApiOkResponse({ type: Task, isArray: true })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('search') search?: string,
  ) {
    return this.tasksService.findAll(status, search);
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
  @Roles(UserRole.ADMIN)
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status (members allowed)' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiBody({ type: UpdateTaskStatusDto })
  @ApiOkResponse({ type: Task })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUser() user: User,
  ) {
    return this.tasksService.updateStatus(id, updateTaskStatusDto);
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
