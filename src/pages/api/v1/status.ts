import { NextApiRequest, NextApiResponse } from "next";

export type statusResponse = {
  status: string;
};

function statusHandler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: "OK" } satisfies statusResponse);
}

export default statusHandler;
