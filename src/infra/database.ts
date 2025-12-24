import cfg from "config";
import { Client } from "pg";
import { ServiceError } from "./errors/errors";

type QueryObject = {
  text: string;
  values: any[];
};

async function query(queryObject: QueryObject | string) {
  let client: Client | undefined;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      cause: err as Error,
      message: "Database connection or query error",
    });
    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    ...cfg.db,
    ssl: getSSLValues(),
  });
  await client.connect();
  return client;
}

const database = {
  query,
  getNewClient,
};

export default database;

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  return cfg.environment === "production" ? true : false;
}
