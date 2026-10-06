import {
  getMigrationStatus,
} from './migration-utils.js';
import { closeDatabasePool } from './pool.js';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

async function main(): Promise<void> {
  try {
    const report = await getMigrationStatus();

    if (!report.initialized) {
      process.stdout.write(
        'Migration history has not been initialized. Run npm run db:migrate.\n',
      );
    }

    if (report.migrations.length === 0) {
      process.stdout.write(
        'No SQL migration files exist yet. Migration infrastructure is ready.\n',
      );

      return;
    }

    process.stdout.write('Database migration status:\n');

    for (const migration of report.migrations) {
      const marker =
        migration.status === 'applied'
          ? '[applied]'
          : '[pending]';

      process.stdout.write(
        `  ${marker} ${migration.filename}\n`,
      );
    }
  } finally {
    await closeDatabasePool();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `Unable to read migration status: ${getErrorMessage(error)}\n`,
  );

  process.exitCode = 1;
});