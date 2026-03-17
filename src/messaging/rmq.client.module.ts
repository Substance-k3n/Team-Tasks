import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TASKS_RMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RMQ_URL') || 'amqp://localhost:5672'],
            queue: configService.get<string>('RMQ_MAIN_QUEUE') || 'team_tasks.main',
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': configService.get<string>('RMQ_DLX') || 'team_tasks.dlx',
                'x-dead-letter-routing-key': 'task.failed',
              },
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RmqClientModule {}
