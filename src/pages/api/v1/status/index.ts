import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import { cfg } from "config";
import { InternalServerError } from "infra/errors";

export type ErrorResponse = {
  name: string;
  message: string;
  action: string;
  status_code: number;
};

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

async function statusHandler(
  _: NextApiRequest,
  res: NextApiResponse<StatusResponse | ErrorResponse>,
) {
  try {
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
  } catch (err) {
    const publicErrorObject = new InternalServerError({ cause: err as Error });
    console.error("Error fetching database status:", publicErrorObject);
    res.status(publicErrorObject.statusCode).json(publicErrorObject.toJSON());
  }
}

export default statusHandler;
