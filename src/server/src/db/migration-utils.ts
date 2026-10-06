import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PoolClient } from 'pg';

import { pool } from './pool.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = resolve(currentDirectory, 'migrations');

interface MigrationFile {
  filename: string;
  sql: string;
  checksum: string;
}

interface AppliedMigration {
  filename: string;
  checksum: string;
}

export interface MigrationStatus {
  filename: string;
  status: 'applied' | 'pending';
}

export interface MigrationStatusReport {
  initialized: boolean;
  migrations: MigrationStatus[];
}

function createChecksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const directoryEntries = await readdir(migrationsDirectory, {
    withFileTypes: true,
  });

  const filenames = directoryEntries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.sql'),
    )
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    filenames.map(async (filename) => {
      const sql = await readFile(
        resolve(migrationsDirectory, filename),
        'utf8',
      );

      if (sql.trim() === '') {
        throw new Error(`Migration ${filename} is empty.`);
      }

      return {
        filename,
        sql,
        checksum: createChecksum(sql),
      };
    }),
  );
}

async function migrationHistoryExists(
  client: PoolClient,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists
    `,
  );

  return result.rows[0]?.exists ?? false;
}

async function ensureMigrationHistory(
  client: PoolClient,
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(
  client: PoolClient,
): Promise<AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(`
    SELECT filename, checksum
    FROM schema_migrations
    ORDER BY filename
  `);

  return result.rows;
}

function validateMigrationHistory(
  migrationFiles: MigrationFile[],
  appliedMigrations: AppliedMigration[],
): void {
  const migrationFilesByName = new Map(
    migrationFiles.map((migration) => [
      migration.filename,
      migration,
    ]),
  );

  for (const appliedMigration of appliedMigrations) {
    const migrationFile = migrationFilesByName.get(
      appliedMigration.filename,
    );

    if (migrationFile === undefined) {
      throw new Error(
        `Applied migration ${appliedMigration.filename} is missing from the migrations directory.`,
      );
    }

    if (migrationFile.checksum !== appliedMigration.checksum) {
      throw new Error(
        `Applied migration ${appliedMigration.filename} has been modified. Applied migrations must remain immutable.`,
      );
    }
  }
}

export async function applyPendingMigrations(): Promise<string[]> {
  const migrationFiles = await loadMigrationFiles();
  const client = await pool.connect();

  try {
    await ensureMigrationHistory(client);

    const appliedMigrations = await getAppliedMigrations(client);

    validateMigrationHistory(
      migrationFiles,
      appliedMigrations,
    );

    const appliedFilenames = new Set(
      appliedMigrations.map((migration) => migration.filename),
    );

    const pendingMigrations = migrationFiles.filter(
      (migration) => !appliedFilenames.has(migration.filename),
    );

    const newlyApplied: string[] = [];

    for (const migration of pendingMigrations) {
      await client.query('BEGIN');

      try {
        await client.query(migration.sql);

        await client.query(
          `
            INSERT INTO schema_migrations (
              filename,
              checksum
            )
            VALUES ($1, $2)
          `,
          [
            migration.filename,
            migration.checksum,
          ],
        );

        await client.query('COMMIT');

        newlyApplied.push(migration.filename);
      } catch (error: unknown) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return newlyApplied;
  } finally {
    client.release();
  }
}

export async function getMigrationStatus(): Promise<MigrationStatusReport> {
  const migrationFiles = await loadMigrationFiles();
  const client = await pool.connect();

  try {
    const initialized = await migrationHistoryExists(client);

    if (!initialized) {
      return {
        initialized: false,
        migrations: migrationFiles.map((migration) => ({
          filename: migration.filename,
          status: 'pending',
        })),
      };
    }

    const appliedMigrations = await getAppliedMigrations(client);

    validateMigrationHistory(
      migrationFiles,
      appliedMigrations,
    );

    const appliedFilenames = new Set(
      appliedMigrations.map((migration) => migration.filename),
    );

    return {
      initialized: true,
      migrations: migrationFiles.map((migration) => ({
        filename: migration.filename,
        status: appliedFilenames.has(migration.filename)
          ? 'applied'
          : 'pending',
      })),
    };
  } finally {
    client.release();
  }
}