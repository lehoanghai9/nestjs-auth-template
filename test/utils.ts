import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export async function createTestDataSource(
   dbOptions: PostgresConnectionOptions,
) {
   const dataSource = new DataSource(dbOptions);
   await dataSource.initialize();
   return dataSource;
}
