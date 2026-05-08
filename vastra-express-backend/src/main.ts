import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Enable rawBody so the Razorpay webhook can verify HMAC against raw payload
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: Helmet - HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // Security: CORS - Cross-Origin Resource Sharing
  const allowedOrigins = [
    'http://localhost:3001', // Admin Panel (dev)
    'http://localhost:3002', // Facility Panel (dev)
    'http://localhost:3003', // Driver App - Expo web (dev)
    'http://localhost:3004', // Customer App - Expo web (dev)
    'http://localhost:8081', // Expo Metro bundler default port
  ];

  const envOrigins =
    configService.get('ALLOWED_ORIGINS', '') ||
    configService.get('CORS_ORIGINS', '');
  if (envOrigins && envOrigins.trim()) {
    allowedOrigins.push(...envOrigins.split(',').map(o => o.trim()).filter(Boolean));
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);

  // ─── Swagger / OpenAPI ─────────────────────────────────────────────────────
  // Only expose API docs in non-production environments to avoid information disclosure
  const nodeEnv = configService.get('NODE_ENV', 'development');
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Vastra Express API')
      .setDescription(
        'REST API for the Vastra Express quick-commerce laundry platform. ' +
          'All endpoints require JWT Bearer authentication unless noted otherwise.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT',
      )
      .addTag('auth', 'Authentication — OTP login, JWT')
      .addTag('users', 'User management')
      .addTag('addresses', 'Customer address book')
      .addTag('pickup-slots', 'Pickup slot management')
      .addTag('orders', 'Order lifecycle')
      .addTag('billing', 'Billing, pricing & invoices')
      .addTag('subscriptions', 'Subscription plans & wallet')
      .addTag('payments', 'Razorpay, COD & wallet payments')
      .addTag('delivery', 'Delivery assignment & tracking')
      .addTag('inventory', 'Facility inventory management')
      .addTag('notifications', 'Push notifications')
      .addTag('reports', 'Analytics & reporting')
      .addTag('facility-allocator', 'Facility allocation and suggestions')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Vastra Express API Docs',
    });
    logger.log(`📚 Swagger docs:             http://localhost:${port}/api/docs`);
  } else {
    logger.log('📚 Swagger docs disabled in production');
  }

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap();
