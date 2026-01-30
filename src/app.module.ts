import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available everywhere
    }),
    TypeOrmModule.forRoot(databaseConfig),
  ],
})
export class AppModule {}