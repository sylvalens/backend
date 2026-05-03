import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const config = app.get(ConfigService);
  
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') || 'http://localhost:3000', // allow configured frontend origin
    credentials: true, // important for cookies
  });

  const port = config.get<number>('PORT') ?? 4000;

  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
