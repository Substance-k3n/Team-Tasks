import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, name, password, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(user);

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

  async login(loginDto: LoginDto) {
    const { email, password, role } = loginDto;

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });
    
    // Explicitly check role if provided
    if (user && user.role !== role) {
      throw new UnauthorizedException('Role mismatch');
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
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