import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

export type statusResponse = {
  status: string;
};

async function statusHandler(_: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: "OK",
  } satisfies statusResponse);
}

export default statusHandler;
