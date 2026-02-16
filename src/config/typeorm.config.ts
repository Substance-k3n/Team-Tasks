import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Team } from '../entities/team.entity';
import { LeaveRequest } from '../entities/leave-request.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'officeflow',
  entities: [User, Team, LeaveRequest],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});