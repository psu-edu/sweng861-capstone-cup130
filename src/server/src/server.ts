import type { Server } from 'node:http';

import app from './app.js';
import {
  environment,
} from './config/environment.js';
import {
  checkDatabaseConnection,
  closeDatabasePool,
} from './db/pool.js';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

function closeHttpServer(
  server: Server,
): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error?: Error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function startServer(): Promise<void> {
  await checkDatabaseConnection();

  const server = app.listen(
    environment.serverPort,
    () => {
      process.stdout.write(
        `Campus Rental API listening on port ${environment.serverPort}\n`,
      );
    },
  );

  let shuttingDown = false;

  const shutdown = async (
    signal: string,
  ): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    process.stdout.write(
      `Received ${signal}. Shutting down Campus Rental API.\n`,
    );

    try {
      await closeHttpServer(server);
      await closeDatabasePool();
    } catch (error: unknown) {
      process.stderr.write(
        `Shutdown error: ${getErrorMessage(error)}\n`,
      );

      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void startServer().catch(
  async (error: unknown) => {
    process.stderr.write(
      `Campus Rental API failed to start: ${getErrorMessage(error)}\n`,
    );

    try {
      await closeDatabasePool();
    } catch (closeError: unknown) {
      process.stderr.write(
        `Database shutdown error: ${getErrorMessage(closeError)}\n`,
      );
    }

    process.exitCode = 1;
  },
);