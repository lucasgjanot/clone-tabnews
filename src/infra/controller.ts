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
} from "./errors";

function onErrorHandler(err: unknown, _: NextApiRequest, res: NextApiResponse) {
  if (err instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(err.statusCode).json(err);
  }
  if (err instanceof BaseHttpError && !(err instanceof ServiceError)) {
    return res.status(err.statusCode).json(err);
  }
  const publicErrorObject = new InternalServerError({
    cause: err as Error,
  });
  console.error(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onNoMatchHandler(req: NextApiRequest, res: NextApiResponse) {
  const methodNotAllowedError = new MethodNotAllowedError({
    method: req.method as string,
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

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
};

export default controller;
