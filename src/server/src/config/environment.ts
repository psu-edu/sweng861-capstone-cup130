import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(currentDirectory, '../../../../.env');

try {
  loadEnvFile(rootEnvPath);
} catch (error: unknown) {
  const errorCode = (error as NodeJS.ErrnoException).code;

  if (errorCode !== 'ENOENT') {
    throw error;
  }
}

function getFirstDefined(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];

    if (value !== undefined && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

function getRequiredEnvironmentValue(...names: string[]): string {
  const value = getFirstDefined(...names);

  if (value === undefined) {
    throw new Error(
      `Missing required environment variable. Expected one of: ${names.join(', ')}`,
    );
  }

  return value;
}

function parsePort(value: string, name: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid TCP port number.`);
  }

  return port;
}

export const environment = Object.freeze({
  serverPort: parsePort(
    getFirstDefined('SERVER_PORT') ?? '3000',
    'SERVER_PORT',
  ),

  database: Object.freeze({
    host: getFirstDefined('DATABASE_HOST') ?? 'localhost',

    port: parsePort(
      getFirstDefined('DATABASE_PORT', 'POSTGRES_HOST_PORT') ?? '5432',
      'DATABASE_PORT/POSTGRES_HOST_PORT',
    ),

    name: getRequiredEnvironmentValue(
      'DATABASE_NAME',
      'POSTGRES_DB',
    ),

    user: getRequiredEnvironmentValue(
      'DATABASE_USER',
      'POSTGRES_USER',
    ),

    password: getRequiredEnvironmentValue(
      'DATABASE_PASSWORD',
      'POSTGRES_PASSWORD',
    ),
  }),

  auth0: Object.freeze({
    domain: getRequiredEnvironmentValue(
      'AUTH0_DOMAIN',
    ),

    audience: getRequiredEnvironmentValue(
      'AUTH0_AUDIENCE',
    ),
  }),
});