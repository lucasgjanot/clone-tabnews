import { createRouter } from "next-connect";
import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import { cfg } from "config";
import { ErrorResponse } from "infra/errors";
import controller from "infra/controller";

export type StatusResponse = {
  updated_at: string;
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    };
  };
};

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  _: NextApiRequest,
  res: NextApiResponse<StatusResponse | ErrorResponse>,
) {
  const databaseVersionResult = await database.query("SHOW server_version;");
  const databaseVersionValue = databaseVersionResult.rows[0].server_version;
  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnectionsValue =
    databaseMaxConnectionsResult.rows[0].max_connections;
  const databaseName = cfg.db.database;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*) FROM pg_stat_activity WHERE datname=$1",
    values: [databaseName as string],
  });
  const databaseOpenedConnectionsValue =
    databaseOpenedConnectionsResult.rows[0].count;
  res.status(200).json({
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: parseInt(databaseOpenedConnectionsValue),
      },
    },
  });
}
