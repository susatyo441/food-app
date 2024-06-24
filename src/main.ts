import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as momentTimezone from 'moment-timezone';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  momentTimezone.tz.setDefault('Asia/Jakarta');
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
