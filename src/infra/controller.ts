import { NextApiRequest, NextApiResponse } from "next";
import {
  InternalServerError,
  MethodNotAllowedError,
  BaseHttpError,
} from "./errors";

function onErrorHandler(err: unknown, _: NextApiRequest, res: NextApiResponse) {
  if (err instanceof BaseHttpError) {
    return res.status(err.statusCode).json(err);
  }
  const publicErrorObject = new InternalServerError({
    cause: err as Error,
    statusCode: (err as BaseHttpError).statusCode,
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

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
