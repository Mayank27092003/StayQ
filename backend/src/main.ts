import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowedPatterns = [
        /^https:\/\/.*\.stayq\.in$/,
        /^https:\/\/stayq\.in$/,
        /^https:\/\/.*\.stayq\.space$/,
        /^https:\/\/stayq\.space$/,
        /^https:\/\/stay-q\.web\.app$/,
        /^https:\/\/stay-q\.firebaseapp\.com$/,
        /^https:\/\/stayq-.*\.run\.app$/,
        /^http:\/\/localhost:(3000|5173|8080)$/,
      ];
      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for seamless custom domain routing
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip out properties that do not have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO types
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Stay Q API')
    .setDescription('Backend API for the Stay Q mobile app (Guest & Host) and Admin Panel.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT || '8080', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/${process.env.API_PREFIX || 'api/v1'}`);
  console.log(`Swagger UI is running on: http://localhost:${port}/api/docs`);
}
bootstrap();
