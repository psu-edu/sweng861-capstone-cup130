import { getTestDatabaseConfig,} from './test-database-config.js';

const testDatabase = getTestDatabaseConfig();

process.env.DATABASE_HOST = testDatabase.host;

process.env.DATABASE_PORT = String(testDatabase.port);

process.env.DATABASE_NAME = testDatabase.database;

process.env.DATABASE_USER = testDatabase.user;

process.env.DATABASE_PASSWORD = testDatabase.password;