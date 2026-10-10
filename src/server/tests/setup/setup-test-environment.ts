import {getTestDatabaseConfig,} from './test-database-config.js';

const testDatabase = getTestDatabaseConfig();

process.env.DATABASE_HOST = testDatabase.host;

process.env.DATABASE_PORT = String(testDatabase.port);

process.env.DATABASE_NAME = testDatabase.database;

process.env.DATABASE_USER = testDatabase.user;

process.env.DATABASE_PASSWORD = testDatabase.password;

process.env.AUTH0_DOMAIN = 'test.auth0.invalid';

process.env.AUTH0_AUDIENCE = 'https://api.campus-rental.test';

process.env.AI_PROVIDER = 'mock';

process.env.AI_BASE_URL = '';

process.env.AI_MODEL = '';

process.env.AI_API_KEY = '';

process.env.AI_MAX_TOKENS = '200';

process.env.AI_TIMEOUT_MS = '20000';