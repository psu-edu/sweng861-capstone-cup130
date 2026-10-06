import {
  applyPendingMigrations,
} from './migration-utils.js';
import { closeDatabasePool } from './pool.js';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

async function main(): Promise<void> {
  try {
    const appliedMigrations =
      await applyPendingMigrations();

    if (appliedMigrations.length === 0) {
      process.stdout.write(
        'Database is up to date. No pending migrations.\n',
      );

      return;
    }

    process.stdout.write(
      `Applied ${appliedMigrations.length} migration(s):\n`,
    );

    for (const filename of appliedMigrations) {
      process.stdout.write(`  - ${filename}\n`);
    }
  } finally {
    await closeDatabasePool();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `Database migration failed: ${getErrorMessage(error)}\n`,
  );

  process.exitCode = 1;
});