import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
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

  const options = new DocumentBuilder()
    .setTitle('SylvaLens API')
    .setDescription('The backend API for SylvaLens')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  
  // Save OpenAPI spec for frontend generation in development
  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync('./openapi-spec.json', JSON.stringify(document, null, 2));
  }
  
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT') ?? 4000;

  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
