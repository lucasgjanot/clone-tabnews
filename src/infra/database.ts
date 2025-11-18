import { cfg } from "config";
import { Client } from "pg";

type QueryObject = {
  text: string;
  values: string[];
};

async function query(queryObject: QueryObject | string) {
  const client = new Client({
    ...cfg.db,
    ssl: getSSLValues(),
  });
  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
}

export default {
  query,
};

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }
  return cfg.environment === "development" ? false : true;
}
