import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(
  fileURLToPath(import.meta.url),
);

const rootEnvPath = resolve(
  currentDirectory,
  '../../../../.env',
);

try {
  loadEnvFile(rootEnvPath);
} catch (error: unknown) {
  const errorCode =
    (error as NodeJS.ErrnoException).code;

  if (errorCode !== 'ENOENT') {
    throw error;
  }
}

export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

function getFirstDefined(
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = process.env[name];

    if (
      value !== undefined &&
      value.trim() !== ''
    ) {
      return value;
    }
  }

  return undefined;
}

function getRequiredEnvironmentValue(
  ...names: string[]
): string {
  const value = getFirstDefined(...names);

  if (value === undefined) {
    throw new Error(
      `Missing required environment variable. Expected one of: ${names.join(', ')}`,
    );
  }

  return value;
}

function parsePort(
  value: string,
  name: string,
): number {
  const port = Number(value);

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      `${name} must be a valid TCP port number.`,
    );
  }

  return port;
}

export function getTestDatabaseConfig():
TestDatabaseConfig {
  const developmentDatabase =
    getRequiredEnvironmentValue(
      'DATABASE_NAME',
      'POSTGRES_DB',
    );

  const testDatabase =
    getFirstDefined(
      'TEST_DATABASE_NAME',
      'POSTGRES_TEST_DB',
    ) ?? `${developmentDatabase}_test`;

  if (testDatabase === developmentDatabase) {
    throw new Error(
      'The test database must be different from the development database.',
    );
  }

  if (!testDatabase.toLowerCase().endsWith('_test')) {
    throw new Error(
      'The test database name must end with "_test".',
    );
  }

  if (!/^[A-Za-z0-9_]+$/.test(testDatabase)) {
    throw new Error(
      'The test database name may contain only letters, numbers, and underscores.',
    );
  }

  return {
    host:
      getFirstDefined('DATABASE_HOST') ??
      'localhost',

    port: parsePort(
      getFirstDefined(
        'DATABASE_PORT',
        'POSTGRES_HOST_PORT',
      ) ?? '5432',
      'DATABASE_PORT/POSTGRES_HOST_PORT',
    ),

    database: testDatabase,

    user: getRequiredEnvironmentValue(
      'DATABASE_USER',
      'POSTGRES_USER',
    ),

    password: getRequiredEnvironmentValue(
      'DATABASE_PASSWORD',
      'POSTGRES_PASSWORD',
    ),
  };
}