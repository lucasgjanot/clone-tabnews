import { NextApiRequest, NextApiResponse } from "next";
import migrationRunner, { RunnerOption } from "node-pg-migrate";
import { RunMigration } from "node-pg-migrate/dist/migration";
import { join } from "node:path";
import database from "infra/database";

type MigrationsResponse = RunMigration[];

type ErrorResponse = {
  error: string;
};

async function migrationsHandler(
  req: NextApiRequest,
  res: NextApiResponse<MigrationsResponse | ErrorResponse>,
) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(req.method as string)) {
    return res.status(405).json({
      error: `Method '${req.method}' not allowed`,
    });
  }
  let dbClient;
  try {
    dbClient = await database.getNewClient();
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
      return res.status(200).json(pendingMigrations);
    }
    if (req.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      if (migratedMigrations.length > 0) {
        return res.status(201).json(migratedMigrations);
      }
      return res.status(200).json(migratedMigrations);
    }
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  } finally {
    if (dbClient) {
      await dbClient.end();
    }
  }
}

export default migrationsHandler;
