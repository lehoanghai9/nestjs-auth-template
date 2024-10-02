import { TestDBInitiator } from './config.e2e';
import * as dotenv from 'dotenv';

dotenv.config();

module.exports = async () => {
  console.log('\n\nSetup test environment');
  globalThis.databaseConfig = new TestDBInitiator();
  await globalThis.databaseConfig.createDatabase();
};