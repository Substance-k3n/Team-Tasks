import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class LoginDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEMBER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({ example: 'password123', format: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
