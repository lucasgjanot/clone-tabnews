import { NextApiRequest, NextApiResponse } from "next";
import database from "../../../infra/database";

export type statusResponse = {
  APIstatus: string;
  DBstatus: string;
};

async function statusHandler(_: NextApiRequest, res: NextApiResponse) {
  const result = await database.query("SELECT 1+1 as sum;");
  const isConnecting = await database.testConnection();
  res.status(200).json({
    APIstatus: "OK",
    DBstatus: isConnecting ? "OK" : "Failed",
  } satisfies statusResponse);
}

export default statusHandler;
