import { ConfigService } from '@nestjs/config';
import { getConfig } from '../src/config/db.config';
import { createDatabase, dropDatabase } from 'typeorm-extension';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { createTestDataSource } from './utils';

export class TestDBInitiator {
   private readonly initialDatabase: string;
   private readonly testDatabase = 'nest-auth-learn-test';
   readonly dbOptions: PostgresConnectionOptions;
   readonly configService: ConfigService;

   constructor() {
      this.configService = new ConfigService();
      const config = getConfig();

      this.initialDatabase = config.database;
      this.dbOptions = {
         ...config,
         database: this.testDatabase,
      };
   }

   async createDatabase() {
      await this.dropDatabase();
      console.log(`Creating test database '${this.dbOptions.database}'`);
      await createDatabase({
         options: this.dbOptions,
         initialDatabase: this.initialDatabase,
         ifNotExist: false,
      });
      const dataSource = await createTestDataSource(this.dbOptions);

      console.log('Running migrations');
      dataSource.runMigrations({ transaction: 'all' });
      await dataSource.destroy();

      console.log('✓ Done. Test database is ready to accept connections ✓\n');
   }

   async dropDatabase(dropAll = false) {
      console.log(`Dropping test database '${this.testDatabase}'`);
      if (dropAll) {
         const ds = await createTestDataSource({
            ...this.dbOptions,
            database: this.initialDatabase,
         });
         await ds.query(
            `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.testDatabase}';`,
         );
      }
      await dropDatabase({
         options: this.dbOptions,
         initialDatabase: this.initialDatabase,
      });
   }

   
}
