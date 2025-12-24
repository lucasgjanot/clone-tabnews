import controller from "infra/controller";
import session from "models/session";
import user, { UserResponse } from "models/user";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse<UserResponse>>();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:user"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>,
) {
  const sessionToken = req.cookies.session_id;

  const validSession = await session.getValidSession(sessionToken);
  const renewedSession = await session.renew(validSession.token);
  controller.setSessionCookie(renewedSession.token, res);

  const authenticatedUser = await user.getUserByUserId(validSession.user_id);
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return res.status(200).json(user.toResponse(authenticatedUser));
}
