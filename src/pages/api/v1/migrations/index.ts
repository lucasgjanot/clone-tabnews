import { NextApiRequest, NextApiResponse } from "next";
import migrationRunner, { RunnerOption } from "node-pg-migrate";
import { RunMigration } from "node-pg-migrate/dist/migration";
import { join } from "node:path";
import database from "infra/database";

type MigrationsResponse = RunMigration[];

async function migrationsHandler(
  req: NextApiRequest,
  res: NextApiResponse<MigrationsResponse>,
) {
  const dbClient = await database.getNewClient();
  const defaultMigrationOptions: RunnerOption = {
    dbClient,
    dryRun: true,
    dir: join(process.cwd(), "src", "infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  };

  if (req.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    await dbClient.end();
    return res.status(200).json(pendingMigrations);
  }
  if (req.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    await dbClient.end();

    if (migratedMigrations.length > 0) {
      return res.status(201).json(migratedMigrations);
    }
    return res.status(200).json(migratedMigrations);
  }
  return res.status(405).end();
}

export default migrationsHandler;
