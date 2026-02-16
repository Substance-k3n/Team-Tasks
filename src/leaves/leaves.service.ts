import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  CreateLeaveDto,
  UpdateLeaveDto,
  ListLeavesQueryDto,
  LeaveResponseDto,
} from './dto/leave.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createLeaveDto: CreateLeaveDto,
    currentUser: User,
  ): Promise<LeaveResponseDto> {
    // Validate dates
    const startDate = new Date(createLeaveDto.startDate);
    const endDate = new Date(createLeaveDto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for conflicting approved leaves
    const conflictingLeave = await this.leaveRepository
      .createQueryBuilder('leave')
      .where('leave.userId = :userId', { userId: currentUser.id })
      .andWhere('leave.status = :status', { status: LeaveStatus.APPROVED })
      .andWhere(
        '(leave.startDate <= :endDate AND leave.endDate >= :startDate)',
        {
          startDate: createLeaveDto.startDate,
          endDate: createLeaveDto.endDate,
        },
      )
      .getOne();

    if (conflictingLeave) {
      throw new BadRequestException(
        'You already have an approved leave during this period',
      );
    }

    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      userId: currentUser.id,
      status: LeaveStatus.PENDING,
    });

    const savedLeave = await this.leaveRepository.save(leave);
    return this.mapToResponseDto(savedLeave);
  }

  async findAll(
    query: ListLeavesQueryDto,
    currentUser: User,
  ): Promise<LeaveResponseDto[]> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('user.team', 'team');

    // Role-based filtering
    if (currentUser.role === UserRole.EMPLOYEE) {
      // Employee can only see their own leaves
      queryBuilder.andWhere('leave.userId = :userId', {
        userId: currentUser.id,
      });
    } else if (currentUser.role === UserRole.MANAGER) {
      // Manager can see own leaves and team members' leaves
      queryBuilder.andWhere(
        '(leave.userId = :userId OR user.teamId = :teamId)',
        {
          userId: currentUser.id,
          teamId: currentUser.teamId,
        },
      );
    }
    // HR can see all leaves (no restriction)

    // Apply query filters
    if (query.userId && currentUser.role !== UserRole.EMPLOYEE) {
      queryBuilder.andWhere('leave.userId = :userId', { userId: query.userId });
    }

    if (query.teamId) {
      queryBuilder.andWhere('user.teamId = :teamId', { teamId: query.teamId });
    }

    if (query.status) {
      queryBuilder.andWhere('leave.status = :status', { status: query.status });
    }

    if (query.type) {
      queryBuilder.andWhere('leave.type = :type', { type: query.type });
    }

    if (query.from && query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.from) {
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
    }

    queryBuilder.orderBy('leave.createdAt', 'DESC');

    const leaves = await queryBuilder.getMany();
    return leaves.map((leave) => this.mapToResponseDto(leave));
  }

  async findOne(id: string, currentUser: User): Promise<LeaveResponseDto> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'user.team'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    // Check authorization
    if (currentUser.role === UserRole.EMPLOYEE) {
      if (leave.userId !== currentUser.id) {
        throw new ForbiddenException('You can only view your own leaves');
      }
    } else if (currentUser.role === UserRole.MANAGER) {
      if (
        leave.userId !== currentUser.id &&
        leave.user.teamId !== currentUser.teamId
      ) {
        throw new ForbiddenException(
          'You can only view your own leaves or your team members leaves',
        );
      }
    }
    // HR can view any leave

    return this.mapToResponseDto(leave);
  }

  async update(
    id: string,
    updateLeaveDto: UpdateLeaveDto,
    currentUser: User,
  ): Promise<LeaveResponseDto> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user', 'user.team'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    // Role-based update logic
    if (currentUser.role === UserRole.EMPLOYEE) {
      // Employee can only edit their own pending leaves
      if (leave.userId !== currentUser.id) {
        throw new ForbiddenException('You can only edit your own leaves');
      }

      if (leave.status !== LeaveStatus.PENDING) {
        throw new ForbiddenException(
          'You can only edit leaves with pending status',
        );
      }

      // Employee can only update these fields
      const allowedFields = ['type', 'startDate', 'endDate', 'reason'];
      const updates: any = {};

      for (const field of allowedFields) {
        if (updateLeaveDto[field] !== undefined) {
          updates[field] = updateLeaveDto[field];
        }
      }

      // Validate dates if updating
      if (updates.startDate || updates.endDate) {
        const startDate = new Date(updates.startDate || leave.startDate);
        const endDate = new Date(updates.endDate || leave.endDate);

        if (endDate < startDate) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      Object.assign(leave, updates);
    } else if (currentUser.role === UserRole.MANAGER) {
      // Manager can update status and managerComment for team leaves
      if (leave.user.teamId !== currentUser.teamId) {
        throw new ForbiddenException(
          'You can only manage leaves from your team',
        );
      }

      if (leave.status !== LeaveStatus.PENDING) {
        throw new BadRequestException(
          'Can only update leaves with pending status',
        );
      }

      // Manager can update status and managerComment
      if (updateLeaveDto.status !== undefined) {
        leave.status = updateLeaveDto.status;
      }

      if (updateLeaveDto.managerComment !== undefined) {
        leave.managerComment = updateLeaveDto.managerComment;
      }
    } else if (currentUser.role === UserRole.HR) {
      // HR can update any field
      Object.assign(leave, updateLeaveDto);
    }

    const updatedLeave = await this.leaveRepository.save(leave);
    return this.mapToResponseDto(updatedLeave);
  }

  async delete(id: string, currentUser: User): Promise<void> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    // Role-based delete logic
    if (currentUser.role === UserRole.EMPLOYEE) {
      // Employee can only cancel their own pending leaves
      if (leave.userId !== currentUser.id) {
        throw new ForbiddenException('You can only cancel your own leaves');
      }

      if (leave.status !== LeaveStatus.PENDING) {
        throw new ForbiddenException(
          'You can only cancel leaves with pending status',
        );
      }
    } else if (currentUser.role === UserRole.MANAGER) {
      // Manager can cancel team member's pending leaves
      if (leave.user.teamId !== currentUser.teamId) {
        throw new ForbiddenException(
          'You can only cancel leaves from your team',
        );
      }

      if (leave.status !== LeaveStatus.PENDING) {
        throw new ForbiddenException(
          'You can only cancel leaves with pending status',
        );
      }
    }
    // HR can delete any leave

    await this.leaveRepository.remove(leave);
  }

  private mapToResponseDto(leave: LeaveRequest): LeaveResponseDto {
    return {
      id: leave.id,
      userId: leave.userId,
      userName: leave.user?.name || '',
      teamName: leave.user?.team?.name || '',
      type: leave.type,
      status: leave.status,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      managerComment: leave.managerComment,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    };
  }
}