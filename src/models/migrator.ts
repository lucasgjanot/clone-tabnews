import database from "infra/database";
import { RunnerOption } from "node-pg-migrate";
import { resolve } from "path";
import migrationRunner from "node-pg-migrate";
import { RunMigration } from "node-pg-migrate/dist/migration";
import { ServiceError } from "infra/errors/errors";

async function runMigrations(dryRun: boolean = true): Promise<RunMigration[]> {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions: RunnerOption = {
      dbClient,
      dryRun: true,
      dir: resolve("src", "infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      log: () => {},
    };
    if (dryRun) {
      const pendingMigrations = await migrationRunner(defaultMigrationOptions);
      return pendingMigrations;
    }
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });
    return migratedMigrations;
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      cause: err as Error,
      message: "Database connection or migration error",
    });
    throw serviceErrorObject;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations: () => runMigrations(true),
  runPendingMigrations: () => runMigrations(false),
};

export default migrator;
