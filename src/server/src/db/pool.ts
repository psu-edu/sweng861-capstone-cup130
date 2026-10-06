import { Pool } from 'pg';

import { environment } from '../config/environment.js';

export const pool = new Pool({
  host: environment.database.host,
  port: environment.database.port,
  database: environment.database.name,
  user: environment.database.user,
  password: environment.database.password,

  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error: Error) => {
  process.stderr.write(
    `Unexpected PostgreSQL connection pool error: ${error.message}\n`,
  );
});

export async function checkDatabaseConnection(): Promise<void> {
  const result = await pool.query<{ database_name: string }>(
    'SELECT current_database() AS database_name',
  );

  if (result.rows.length !== 1) {
    throw new Error('PostgreSQL connectivity check returned an unexpected result.');
  }
}

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}