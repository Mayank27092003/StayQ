import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');
  const allowedOrigins = [
    'https://admin.stayq.space',
    'https://stayq.space',
    'https://www.stayq.space',
    'https://stayq-admin.web.app',
    'https://stayq-app.web.app',
    'https://stayq-website.web.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ];

  app.enableCors({
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.stayq.space') ||
        origin.endsWith('.web.app') ||
        origin.endsWith('.firebaseapp.com')
      ) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-key',
      'x-requested-with',
      'Accept',
      'Origin',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();
  if (process.env.SWAGGER_ENABLED === 'true')
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('StayQ API')
          .setVersion('1.0')
          .addBearerAuth()
          .build(),
      ),
    );
}
export async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  configureApp(app);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  // Register the raw-body aware parser before listen; larger media goes to object storage.
  (app as any).useBodyParser('json', { limit: '512kb' });
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid PORT');
  await app.listen(port, '0.0.0.0');
  return app;
}
if (require.main === module)
  bootstrap().catch(() => {
    console.error(
      'Backend startup failed. Check configuration and database connectivity.',
    );
    process.exitCode = 1;
  });
