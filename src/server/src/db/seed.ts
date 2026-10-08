import {
  applyDevelopmentSeed,
} from './seed-utils.js';

import {
  closeDatabasePool,
} from './pool.js';

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

async function main(): Promise<void> {
  try {
    await applyDevelopmentSeed();

    process.stdout.write(
      'Development/demo seed data applied successfully.\n',
    );
  } finally {
    await closeDatabasePool();
  }
}

void main().catch(
  (error: unknown) => {
    process.stderr.write(
      `Database seed failed: ${getErrorMessage(error)}\n`,
    );

    process.exitCode = 1;
  },
);