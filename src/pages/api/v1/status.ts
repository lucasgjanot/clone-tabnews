import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
const cfg = require("config.ts");

export type statusResponse = {
  updated_at: string;
  dependencies: {
    database: {
      version: string;
      max_connections: number | "Error";
      opened_connections: number | "Error";
    };
  };
};

async function statusHandler(_: NextApiRequest, res: NextApiResponse) {
  const databaseVersionResult = await database.query("SHOW server_version;");
  let databaseVersionValue = "Error";
  if (databaseVersionResult) {
    databaseVersionValue = databaseVersionResult.rows[0].server_version;
  }

  const databaseMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  let databaseMaxConnectionsValue = "Error";
  if (databaseMaxConnectionsResult) {
    databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;
  }

  const databaseName = cfg.db.database;
  const databaseOpenedConnectionsResult = await database.query({
    text: "SELECT count(*) FROM pg_stat_activity WHERE datname=$1",
    values: [databaseName],
  });
  let databaseOpenedConnectionsValue = "Error";
  if (databaseOpenedConnectionsResult) {
    databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;
  }

  res.status(200).json({
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        version: databaseVersionValue,
        max_connections: parseInt(databaseMaxConnectionsValue),
        opened_connections: parseInt(databaseOpenedConnectionsValue),
      },
    },
  } satisfies statusResponse);
}

export default statusHandler;
