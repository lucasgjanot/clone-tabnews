import { createRouter } from "next-connect";
import { NextApiRequest, NextApiResponse } from "next";
import migrationRunner, { RunnerOption } from "node-pg-migrate";
import { RunMigration } from "node-pg-migrate/dist/migration";
import { resolve } from "node:path";
import database from "infra/database";
import { errorHandler, ErrorResponse, notAllowedHandler } from "infra/errors";

type MigrationsResponse = RunMigration[];

const router = createRouter<
  NextApiRequest,
  NextApiResponse<MigrationsResponse | ErrorResponse>
>();

const getHandler = handleMigration(true);
const postHandler = handleMigration(false);

router.get(getHandler).post(postHandler);

export default router.handler({
  onNoMatch: notAllowedHandler,
  onError: errorHandler,
});

function handleMigration(dryRun: boolean) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const migrations = await runMigration(dryRun);
    const status = !dryRun && migrations.length > 0 ? 201 : 200;
    return res.status(status).json(migrations);
  };
}

async function runMigration(dryRun: boolean = true): Promise<RunMigration[]> {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions: RunnerOption = {
      dbClient,
      dryRun: true,
      dir: resolve("src", "infra", "migrations"),
      direction: "up",
      migrationsTable: "pgmigrations",
      verbose: true,
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
    console.error((err as Error).message);
    throw err;
  } finally {
    await dbClient?.end();
  }
}
