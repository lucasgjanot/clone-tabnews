import { cfg } from "config";
import { Client } from "pg";

type QueryObject = {
  text: string;
  values: string[];
};

async function query(queryObject: QueryObject | string) {
  let client: Client | undefined;
  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    throw err;
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
