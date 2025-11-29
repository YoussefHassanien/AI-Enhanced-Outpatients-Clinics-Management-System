import { Environment } from '@app/common';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AuthModule } from './auth.module';

const bootstrap = async () => {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const globalPrefix = configService.getOrThrow<string>('GLOBAL_PREFIX');
  const version = configService.getOrThrow<string>('VERSION');
  const environment = configService.getOrThrow<Environment>('ENVIRONMENT');
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
      forbidNonWhitelisted: true,
    }),
  );

  if (environment === Environment.DEVELOPMENT) {
    app.enableCors();
    const config = new DocumentBuilder()
      .setTitle('CodeBlue Project APIs Documentation')
      .setDescription(
        'These APIs are made for CodeBlue project that mainly serve pregnant El Kasr El Ainy Outpatients Clinics',
      )
      .setVersion('1.0.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(
      `${globalPrefix}/v${version}/docs`,
      app,
      documentFactory,
    );
  } else if (environment === Environment.PRODUCTION) {
    app.enableCors({
      origin: configService.getOrThrow<string>('AUDIENCE'),
      methods: configService.getOrThrow<string[]>('METHODS'),
      allowedHeaders: configService.getOrThrow<string[]>('ALLOWED_HEADERS'),
      credentials: configService.getOrThrow<boolean>('CREDENTIALS'),
    });
  }

  await app.listen(port);

  const appUrl = await app.getUrl();
  logger.log(`Server started at: ${appUrl}/${globalPrefix}/v${version}`);
};

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Server failed to start',
    error instanceof Error ? error.stack : String(error),
  );
});
