import controller from "infra/controller";
import { ErrorResponse, ValidationError } from "infra/errors";
import user, { PublicUser } from "models/user";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

type UsersResponse = PublicUser | ErrorResponse;

const router = createRouter<NextApiRequest, NextApiResponse<UsersResponse>>();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  req: NextApiRequest,
  res: NextApiResponse<UsersResponse>,
) {
  const username = req.query.username;
  if (typeof username !== "string") {
    throw new ValidationError({ message: "Invalid username parameter" });
  }
  const result = await user.getUserByUsername(username);
  return res.status(200).json(user.getPublicUser(result));
}
