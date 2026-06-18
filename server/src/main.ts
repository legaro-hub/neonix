import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.setGlobalPrefix('api');

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  app.use(cookieParser());

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    Logger.error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set', 'Bootstrap');
    process.exit(1);
  }
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    Logger.error('JWT secrets must be at least 32 characters. Use: openssl rand -hex 32', 'Bootstrap');
    process.exit(1);
  }

  app.getHttpAdapter().get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  Logger.log(`🚀 Neonix API running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
