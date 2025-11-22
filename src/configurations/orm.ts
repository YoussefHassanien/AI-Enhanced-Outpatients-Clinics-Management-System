import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceAsyncOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    return {
      type: 'postgres',
      url: configService.getOrThrow<string>('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: true,
      },
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migration/*{.js,.ts}'],
      synchronize: false,
      logging: ['error', 'warn'],
      migrationsRun: true,
    };
  },
};

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migration/*{.js,.ts}'],
  synchronize: false,
  logging: ['error', 'warn'],
  migrationsRun: true,
};

export const dataSource = new DataSource(dataSourceOptions);
