import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';

const isJestRuntime =
  process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

function getBullConnection(redisUrl?: string) {
  const parsedUrl = new URL(redisUrl || 'redis://localhost:6379');
  const dbPath = parsedUrl.pathname.replace('/', '');

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || '6379'),
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    db: dbPath ? Number(dbPath) || 0 : 0,
  };
}

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ConfigModule.forRoot({
      isGlobal: true, // Makes env vars available everywhere
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const isTestRuntime =
          configService.get<string>('NODE_ENV') === 'test' ||
          !!process.env.JEST_WORKER_ID;

        if (!redisUrl || isTestRuntime) {
          return {
            ttl: 60_000,
          };
        }

        return {
          store: await redisStore({
            url: redisUrl,
          }),
          ttl: 60_000,
        };
      },
    }),
    ...(!isJestRuntime
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              connection: getBullConnection(
                configService.get<string>('REDIS_URL'),
              ),
            }),
          }),
        ]
      : []),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: true,
        ssl: configService.get<string>('DATABASE_URL') ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    TasksModule,
    UsersModule,
    GatewayModule,
    ...(!isJestRuntime ? [NotificationsModule] : []),
  ],
})
export class AppModule {}
