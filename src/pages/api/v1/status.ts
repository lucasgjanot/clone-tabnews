import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import { db } from "config";

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
  try {
    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;
    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;
    const databaseName = db.database;
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
    } satisfies statusResponse);
  } catch (err) {
    res.status(200).json({
      updated_at: new Date().toISOString(),
      dependencies: {
        database: {
          version: "Error",
          max_connections: "Error",
          opened_connections: "Error",
        },
      },
    } satisfies statusResponse);
  }
}

export default statusHandler;
