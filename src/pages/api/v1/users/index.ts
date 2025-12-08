import controller from "infra/controller";
import { ErrorResponse, ValidationError } from "infra/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import user, { PublicUser } from "models/user";

type UsersResponse = PublicUser;

const router = createRouter<
  NextApiRequest,
  NextApiResponse<UsersResponse | ErrorResponse>
>();

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // const users = users.listUsers();
  res.status(200).json([]);
}

async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  type Parameters = {
    username: string;
    email: string;
    password: string;
  };

  const userInputValues: Parameters = req.body;
  if (
    !userInputValues ||
    !userInputValues.username ||
    !userInputValues.email ||
    !userInputValues.password
  ) {
    throw new ValidationError({ message: "Missing required parameters" });
  }

  const newUser = await user.create(userInputValues);

  res.status(201).json(user.getPublicUser(newUser));
}
