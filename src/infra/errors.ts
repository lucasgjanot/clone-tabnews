export type ErrorResponse = {
  name: string;
  message: string;
  action: string;
  status_code: number;
};

export abstract class BaseHttpError extends Error {
  public readonly action: string;
  public readonly statusCode: number;

  protected constructor({
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

  toJSON(): ErrorResponse {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class InternalServerError extends BaseHttpError {
  constructor({ cause, statusCode }: { cause?: Error; statusCode?: number }) {
    super({
      name: "InternalServerError",
      message: "Unexpected Error",
      action: "Contact support for help",
      statusCode: statusCode || 500,
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

export class ServiceError extends BaseHttpError {
  constructor({ cause, message }: { cause?: Error; message?: string }) {
    super({
      name: "ServiceError",
      message: message || "Service unavailable",
      action: "Verify if service is available",
      statusCode: 503,
      cause: cause,
    });
  }
}

export class ValidationError extends BaseHttpError {
  constructor({ message, action }: { message?: string; action?: string }) {
    super({
      name: "ValidationError",
      message: message || "A validation error occured",
      action: action || "Adjust sent data and try again",
      statusCode: 400,
    });
  }
}

export class NotFoundError extends BaseHttpError {
  constructor({ message, action }: { message?: string; action?: string }) {
    super({
      name: "NotFoundError",
      message: message || "Resource not found",
      action: action || "Adjust query and try again",
      statusCode: 404,
    });
  }
}
export class UnauthorizedError extends BaseHttpError {
  constructor({
    message,
    action,
    cause,
  }: {
    message?: string;
    action?: string;
    cause?: Error;
  } = {}) {
    super({
      name: "UnauthorizedError",
      message: message || "Authentication failed.",
      action: action || "The provided credentials are invalid or expired.",
      statusCode: 401,
      cause,
    });
  }
}
