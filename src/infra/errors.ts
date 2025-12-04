export class InternalServerError extends Error {
  action: string;
  statusCode: number;
  constructor({ cause }: { cause?: Error }) {
    super("unexpected error", { cause });
    this.name = "InternalServerError";
    this.action = "contact support for help";
    this.statusCode = 500;
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
