import { CommonServices, LoggingMiddleware, LoggingService } from '@app/common';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(ApiGatewayModule);

  const configService = app.get(ConfigService);
  const logger = app.get<LoggingService>(CommonServices.LOGGING);
  const port = configService.getOrThrow<number>('PORT');
  const globalPrefix = configService.getOrThrow<string>('GLOBAL_PREFIX');
  const version = configService.getOrThrow<string>('VERSION');
  const cookiesSecret = configService.getOrThrow<string>('COOKIES_SECRET');

  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: version,
  });
  app.use(helmet());
  app.use(cookieParser(cookiesSecret));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useLogger(logger);
  app.use(LoggingMiddleware(configService, 'api-gateway'));
  app.enableCors({
    origin: configService.getOrThrow<string>('AUDIENCE'),
    methods: configService.getOrThrow<string[]>('METHODS'),
    credentials: configService.getOrThrow<boolean>('CREDENTIALS'),
  });

  // MUST BE DELETED ON PRODUCTION
  const config = new DocumentBuilder()
    .setTitle('CodeBlue Project APIs Documentation')
    .setDescription(
      'These APIs are made for CodeBlue project that mainly serve El Kasr El Ainy Outpatients Clinics',
    )
    .setVersion('1.0.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/v${version}/docs`, app, documentFactory);

  await app.listen(port);

  const appUrl = await app.getUrl();
  logger.log(
    `API Gateway is running at: ${appUrl}/${globalPrefix}/v${version}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Api-Gateway');
  logger.error(
    'API Gateway failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
