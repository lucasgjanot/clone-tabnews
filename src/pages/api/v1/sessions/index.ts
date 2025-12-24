import controller from "infra/controller";
import { ForbiddenError, ValidationError } from "infra/errors/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session, { SessionResponse } from "models/session";
import authorization from "models/authorization";

type SessionsResponse = SessionResponse;

const router = createRouter<
  NextApiRequest,
  NextApiResponse<SessionsResponse>
>();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(
  req: NextApiRequest,
  res: NextApiResponse<SessionsResponse>,
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
  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "You do not have permission to log in.",
      action: "Please contact support if you believe this is an error.",
    });
  }
  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(newSession.token, res);

  res.status(201).json(session.toResponse(newSession));
}

async function deleteHandler(
  req: NextApiRequest,
  res: NextApiResponse<SessionsResponse>,
) {
  const sessionToken = req.cookies?.session_id;
  const validSession = await session.getValidSession(sessionToken);
  const expiredSession = await session.expireById(validSession.id);
  controller.clearSessionCookie(res);

  res.status(200).json(session.toResponse(expiredSession));
}
