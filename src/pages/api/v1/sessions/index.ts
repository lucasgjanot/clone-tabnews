import controller from "infra/controller";
import { ErrorResponse, ValidationError } from "infra/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";

type SessionResponse = {} | ErrorResponse;

const router = createRouter<NextApiRequest, NextApiResponse<SessionResponse>>();

router.post(postHandler).delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  req: NextApiRequest,
  res: NextApiResponse<SessionResponse>,
) {
  type Parameters = {
    email: string;
    password: string;
  };

  const userInputValues: Parameters = req.body;

  if (!userInputValues || !userInputValues.email || !userInputValues.password) {
    throw new ValidationError({ message: "Missing required parameters" });
  }

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );
  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(newSession.token, res);

  res.status(201).json(newSession);
}

async function deleteHandler(req: NextApiRequest, res: NextApiResponse) {
  const sessionToken = req.cookies.session_id;

  const validSession = await session.getValidSession(sessionToken);
  const expiredSession = await session.expireById(validSession.id);
  controller.clearSessionCookie(res);

  res.status(200).json(expiredSession);
}
