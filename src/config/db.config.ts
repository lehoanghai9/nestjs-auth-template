import { ConfigService } from '@nestjs/config';
import entities from "../database";
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const ENTITIES = entities;
const MIGRATIONS = [__dirname + '/../../migration/*.{ts,js}'];

export function getConfig(config: ConfigService) {
   return {
      type: 'postgres',
      host: config.get<string>('DB_HOST'),
      port: config.get<number>('DB_PORT'),
      username: config.get<string>('DB_USERNAME'),
      password: config.get<string>('DB_PASSWORD'),
      database: 'nest-auth-learn',
      entities: ENTITIES,
      /* migrations: MIGRATIONS, */
      synchronize: true,
   } as PostgresConnectionOptions;
}
