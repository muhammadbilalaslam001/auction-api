import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WebSocketAdapter } from './websocket/ws.adapter';
import { JwtService } from '@nestjs/jwt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const jwtService = app.get(JwtService);

  // CORS configuration
  const environment = configService.get<string>('NODE_ENV');
  const frontendUrl =
    environment === 'development'
      ? configService.get<string>('APP_LOCALHOST_URL')
      : configService.get<string>('APP_FRONTEND_URL');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global interceptors and filters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useWebSocketAdapter(new WebSocketAdapter(app, configService, jwtService));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
