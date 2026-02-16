import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../../entities/user.entity';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
  status: string;
  teamName?: string;
}

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}