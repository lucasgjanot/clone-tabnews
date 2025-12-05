import { NextApiRequest, NextApiResponse } from "next";

export type ErrorResponse = {
  name: string;
  message: string;
  action: string;
  status_code: number;
};

class BaseHttpError extends Error {
  action: string;
  statusCode: number;

  constructor({
    message,
    action,
    statusCode,
    name,
    cause,
  }: {
    name: string;
    message: string;
    action: string;
    statusCode: number;
    cause?: Error;
  }) {
    super(message, { cause });
    this.name = name;
    this.action = action;
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class InternalServerError extends BaseHttpError {
  constructor({ cause }: { cause?: Error }) {
    super({
      name: "InternalServerError",
      message: "Unexpected Error",
      action: "Contact support for help",
      statusCode: 500,
      cause: cause,
    });
  }
}

export class MethodNotAllowedError extends BaseHttpError {
  constructor({ method }: { method: string }) {
    super({
      name: "MethodNotAllowedError",
      message: `'${method}' method not allowed in this endpoint`,
      action: "Verify if sent HTTP method is allowed in this endpoint",
      statusCode: 405,
    });
  }
}

export function errorHandler(
  err: unknown,
  _: NextApiRequest,
  res: NextApiResponse,
) {
  const internalServerError = new InternalServerError({ cause: err as Error });
  console.error(internalServerError);
  res.status(internalServerError.statusCode).json(internalServerError.toJSON());
}

export function notAllowedHandler(req: NextApiRequest, res: NextApiResponse) {
  const methodNotAllowedError = new MethodNotAllowedError({
    method: req.method as string,
  });
  res
    .status(methodNotAllowedError.statusCode)
    .json(methodNotAllowedError.toJSON());
}
