import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Team Tasks API')
    .setDescription('API for authentication, users, and tasks')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 Swagger docs on http://localhost:3000/docs');
}
bootstrap().catch((err) => {
  // You can improve this to use a proper logger
  console.error('Error during NestJS bootstrap:', err);
});
