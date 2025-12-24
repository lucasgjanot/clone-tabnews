import { UnauthorizedError } from "./errors";

export class SessionNotFoundError extends UnauthorizedError {
  constructor(cause?: Error) {
    super({
      message: "User does not have an active session.",
      action: "Verify that this user is logged in and try again.",
      cause,
    });
  }
}
