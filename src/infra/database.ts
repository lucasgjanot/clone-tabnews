const cfg = require("../config.ts");
import { Client } from "pg";

async function query(queryObject: string) {
  const client = new Client(cfg.db);
  await client.connect();
  const result = await client.query(queryObject);
  await client.end();
  return result;
}

async function testConnection() {
  const result = await query("SELECT 1+1;");
  if (!result) return false;
  return true;
}

export default {
  query,
  testConnection,
};
