import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/users.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, role } = loginDto;

    // Check if user exists
    let user = await this.userRepository.findOne({ where: { email } });

    // If user doesn't exist, create them (simplified for intern project)
    if (!user) {
      user = this.userRepository.create({
        email,
        name: email.split('@')[0], // Extract name from email
        role,
      });
      await this.userRepository.save(user);
    }

    // Verify role matches (in real app, this would be password check)
    if (user.role !== role) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
