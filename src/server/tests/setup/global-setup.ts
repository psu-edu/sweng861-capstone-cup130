import { Pool } from 'pg';

import {
  getTestDatabaseConfig,
} from './test-database-config.js';

export async function setup(): Promise<void> {
  const testDatabase =
    getTestDatabaseConfig();

  const maintenancePool = new Pool({
    host: testDatabase.host,
    port: testDatabase.port,
    database: 'postgres',
    user: testDatabase.user,
    password: testDatabase.password,

    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const result =
      await maintenancePool.query<{
        exists: boolean;
      }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM pg_database
            WHERE datname = $1
          ) AS exists
        `,
        [
          testDatabase.database,
        ],
      );

    const databaseExists =
      result.rows[0]?.exists ?? false;

    if (!databaseExists) {
      await maintenancePool.query(
        `CREATE DATABASE "${testDatabase.database}"`,
      );
    }
  } finally {
    await maintenancePool.end();
  }

  const testPool = new Pool({
    host: testDatabase.host,
    port: testDatabase.port,
    database: testDatabase.database,
    user: testDatabase.user,
    password: testDatabase.password,

    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await testPool.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
    `);
  } finally {
    await testPool.end();
  }
}