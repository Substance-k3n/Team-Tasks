import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { INTERNAL_GRPC_PACKAGE } from './grpc/grpc.constants';
import { setupRabbitMqTopology } from './messaging/rmq.setup';

async function bootstrap() {
  await setupRabbitMqTopology();

  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RMQ_MAIN_QUEUE || 'team_tasks.main',
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': process.env.RMQ_DLX || 'team_tasks.dlx',
          'x-dead-letter-routing-key': 'task.failed',
        },
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: INTERNAL_GRPC_PACKAGE,
      protoPath: join(process.cwd(), 'src/grpc/internal.proto'),
      url: process.env.INTERNAL_GRPC_URL || '0.0.0.0:50051',
    },
  });

  app.use(helmet());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Team Tasks API')
    .setDescription('API for authentication, users, and tasks')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT || '3000');

  await app.startAllMicroservices();
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs on http://localhost:${port}/docs`);
}
bootstrap().catch((err) => {
  // You can improve this to use a proper logger
  console.error('Error during NestJS bootstrap:', err);
});
