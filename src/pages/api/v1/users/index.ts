import controller from "infra/controller";
import { ValidationError } from "infra/errors/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import user, { PublicUserResponse } from "models/user";
import activation from "models/activation";

type UsersResponse = PublicUserResponse;

const router = createRouter<NextApiRequest, NextApiResponse<UsersResponse>>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  req: NextApiRequest,
  res: NextApiResponse<UsersResponse>,
) {
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

  const newToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, newToken);

  res.status(201).json(user.toPublicResponse(newUser));
}
