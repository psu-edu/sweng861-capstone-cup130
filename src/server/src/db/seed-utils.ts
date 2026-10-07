import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getMigrationStatus,
} from './migration-utils.js';

import {
  pool,
} from './pool.js';

const currentDirectory =
  dirname(fileURLToPath(import.meta.url));

const developmentSeedPath =
  resolve(
    currentDirectory,
    'seeds',
    'development-demo.sql',
  );

export async function applyDevelopmentSeed():
Promise<void> {
  const migrationStatus =
    await getMigrationStatus();

  if (!migrationStatus.initialized) {
    throw new Error(
      'Database migrations have not been initialized.',
    );
  }

  const pendingMigrations =
    migrationStatus.migrations.filter(
      (migration) =>
        migration.status === 'pending',
    );

  if (pendingMigrations.length > 0) {
    throw new Error(
      'Database has pending migrations. Run db:migrate before db:seed.',
    );
  }

  const seedSql =
    await readFile(
      developmentSeedPath,
      'utf8',
    );

  if (seedSql.trim() === '') {
    throw new Error(
      'Development seed file is empty.',
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(seedSql);

    await client.query('COMMIT');
  } catch (error: unknown) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
}