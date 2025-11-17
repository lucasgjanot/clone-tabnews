import { db } from "config";
import { Client } from "pg";

type QueryObject = {
  text: string;
  values: string[];
};

async function query(queryObject: QueryObject | string) {
  const client = new Client({ ...db, ssl: { rejectUnauthorized: false } });
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
