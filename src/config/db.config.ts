import { ConfigService } from '@nestjs/config';
import entities from '../database';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// dont change this file, it is only needed for testing, ORM configuration and commands (migrations, etc.)
config();
const configService = new ConfigService();

const ENTITIES = entities;
const MIGRATIONS = [resolve(__dirname + '/../database/migrations/*.{ts,js}')];
export function getConfig() {
   return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST'),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: 'nest-auth-learn',
      entities: ENTITIES,
      migrations: MIGRATIONS,
      synchronize: false,
   } as PostgresConnectionOptions;
}

const AppDataSource = new DataSource(getConfig());

export default AppDataSource;
