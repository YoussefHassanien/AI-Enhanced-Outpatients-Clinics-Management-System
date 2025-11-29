import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load environment variables from a specific .env file
config({ path: './libs/common/.env' });

export const dataSourceAsyncOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    return {
      type: 'postgres',
      url: configService.getOrThrow<string>('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false,
      },
      autoLoadEntities: true,
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
  entities: [__dirname + '/../../../../apps/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../../../apps/**/migration/*{.ts,.js}'],
  synchronize: false,
  logging: ['error', 'warn'],
};

export const dataSource = new DataSource(dataSourceOptions);
