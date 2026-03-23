import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
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

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 Swagger docs on http://localhost:3000/docs');
}
bootstrap().catch((err) => {
  // You can improve this to use a proper logger
  console.error('Error during NestJS bootstrap:', err);
});
