import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class LoginResponseDto {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    teamId: string;
  };
}