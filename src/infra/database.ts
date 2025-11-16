import { db } from "config";
import { Client } from "pg";

type QueryObject = {
  text: string;
  values: string[];
};

async function query(queryObject: QueryObject | string) {
  const client = new Client(db);
  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    console.error(err);
    return;
  } finally {
    await client.end();
  }
}

export default {
  query,
};
