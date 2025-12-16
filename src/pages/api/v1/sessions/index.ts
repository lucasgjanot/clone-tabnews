import controller from "infra/controller";
import * as cookie from "cookie";
import { ErrorResponse, ValidationError } from "infra/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";
import cfg from "config";

type SessionResponse = {} | ErrorResponse;

const router = createRouter<NextApiRequest, NextApiResponse<SessionResponse>>();

router.post(postHandler);

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
  const SetCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    secure: cfg.environment === "production",
    httpOnly: true,
  });
  res.setHeader("Set-Cookie", SetCookie);

  res.status(201).json(newSession);
}
