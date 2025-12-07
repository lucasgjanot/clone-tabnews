import { createRouter } from "next-connect";
import { NextApiRequest, NextApiResponse } from "next";
import { RunMigration } from "node-pg-migrate/dist/migration";
import { ErrorResponse } from "infra/errors";
import controller from "infra/controller";
import migrator from "models/migrator";

type MigrationsResponse = RunMigration[];

const router = createRouter<
  NextApiRequest,
  NextApiResponse<MigrationsResponse | ErrorResponse>
>();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(_: NextApiRequest, res: NextApiResponse) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return res.status(200).json(pendingMigrations);
}

async function postHandler(_: NextApiRequest, res: NextApiResponse) {
  const migratedMigrations = await migrator.runPendingMigrations();
  if (migratedMigrations.length === 0) {
    return res.status(200).json(migratedMigrations);
  }
  return res.status(201).json(migratedMigrations);
}
