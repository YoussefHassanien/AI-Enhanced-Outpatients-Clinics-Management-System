import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Environment } from './constants/enums';

const bootstrap = async () => {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const globalPrefix = configService.getOrThrow<string>('GLOBAL_PREFIX');
  const version = configService.getOrThrow<string>('VERSION');
  const environment = configService.getOrThrow<Environment>('ENVIRONMENT');

  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: version,
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (environment === Environment.DEVELOPMENT) {
    app.enableCors();
    const config = new DocumentBuilder()
      .setTitle('MOMent Project APIs Documentation')
      .setDescription(
        'These APIs are made for MOMent project that mainly serve pregnant women',
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
