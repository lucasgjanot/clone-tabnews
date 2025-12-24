import * as cookie from "cookie";
import cfg from "config";
import session from "models/session";

import { NextApiRequest, NextApiResponse } from "next";
import {
  InternalServerError,
  MethodNotAllowedError,
  BaseHttpError,
  ServiceError,
  UnauthorizedError,
  ForbiddenError,
} from "./errors/errors";
import user, { User } from "models/user";
import { NextHandler } from "next-connect";
import authorization from "models/authorization";

type RequestWithContext = NextApiRequest & {
  context?: {
    user?: Partial<User>;
  };
};

function onErrorHandler(err: unknown, _: NextApiRequest, res: NextApiResponse) {
  if (err instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(err.statusCode).json(err.toJSON());
  }
  if (err instanceof BaseHttpError && !(err instanceof ServiceError)) {
    return res.status(err.statusCode).json(err.toJSON());
  }
  const publicErrorObject = new InternalServerError({
    cause: err as Error,
  });
  console.error(publicErrorObject);
  return res
    .status(publicErrorObject.statusCode)
    .json(publicErrorObject.toJSON());
}

function onNoMatchHandler(req: NextApiRequest, res: NextApiResponse) {
  const methodNotAllowedError = new MethodNotAllowedError({
    method: req.method ?? "UNKNOWN",
  });
  res
    .status(methodNotAllowedError.statusCode)
    .json(methodNotAllowedError.toJSON());
}

function setSessionCookie(sessionToken: string, response: NextApiResponse) {
  const SetCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: cfg.environment === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", SetCookie);
}

function clearSessionCookie(response: NextApiResponse) {
  const SetCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: cfg.environment === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", SetCookie);
}

async function injectAnonymousOrUser(
  req: NextApiRequest,
  _: NextApiResponse,
  next: NextHandler,
) {
  const sessionToken = req.cookies?.session_id;
  if (sessionToken) {
    await injectAuthenticatedUser(req);
  } else {
    injectAnonymousUser(req);
  }
  return next();

  async function injectAuthenticatedUser(req: NextApiRequest) {
    const request = req as RequestWithContext;
    const sessionToken = req.cookies.session_id;
    const validSession = await session.getValidSession(sessionToken);
    const authenticatedUser = await user.getUserByUserId(validSession.user_id);
    request.context = {
      ...request.context,
      user: authenticatedUser,
    };
  }

  async function injectAnonymousUser(req: NextApiRequest) {
    const request = req as RequestWithContext;
    const anonymousUser = {
      features: ["read:activation_token", "create:session", "create:user"],
    };
    request.context = {
      ...request.context,
      user: anonymousUser,
    };
  }
}

function canRequest(feature: string) {
  return (req: NextApiRequest, _: NextApiResponse, next: NextHandler) => {
    const userTryingToRequest = req.context.user as User;
    if (!authorization.can(userTryingToRequest, feature)) {
      throw new ForbiddenError({
        message: "You do not have permission to perform this action.",
        action: `Ensure that your user account has the required feature "${feature}" before attempting this action.`,
      });
    }
    return next();
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
