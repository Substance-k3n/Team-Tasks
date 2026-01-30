import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/users.entity';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
