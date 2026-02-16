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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeavesService } from './leaves.service';
import {
  CreateLeaveDto,
  UpdateLeaveDto,
  ListLeavesQueryDto,
  LeaveResponseDto,
} from './dto/leave.dto';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Get()
  async listLeaves(
    @Query() query: ListLeavesQueryDto,
    @Req() req,
  ): Promise<LeaveResponseDto[]> {
    return this.leavesService.findAll(query, req.user);
  }

  @Get(':id')
  async getLeave(
    @Param('id') id: string,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.findOne(id, req.user);
  }

  @Post()
  async createLeave(
    @Body() createLeaveDto: CreateLeaveDto,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  @Put(':id')
  async updateLeave(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.update(id, updateLeaveDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLeave(@Param('id') id: string, @Req() req): Promise<void> {
    return this.leavesService.delete(id, req.user);
  }
}