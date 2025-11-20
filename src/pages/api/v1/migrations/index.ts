import { cfg } from "config";
import { NextApiRequest, NextApiResponse } from "next";
import migrationRunner from "node-pg-migrate";
import { join } from "node:path";

type MigrationsResponse = string[];

async function migrationsHandler(
  _: NextApiRequest,
  res: NextApiResponse<MigrationsResponse>,
) {
  console.log(process.cwd());
  const migrations = await migrationRunner({
    databaseUrl: cfg.db.databaseURL,
    dryRun: true,
    dir: join(process.cwd(), "src", "infra", "migrations"),
    direction: "up",
    migrationsTable: "pgmigrations",
    verbose: true,
  });
  res.status(200).json([]);
}
export default migrationsHandler;
