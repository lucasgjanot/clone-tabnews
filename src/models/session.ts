import crypto from "node:crypto";
import database from "infra/database";
import { UnauthorizedError } from "infra/errors/errors";
import { SessionNotFoundError } from "infra/errors/session";

export type SessionShape<TDate> = {
  id: string;
  token: string;
  user_id: string;
  expires_at: TDate;
  created_at: TDate;
  updated_at: TDate;
};

export type Session = SessionShape<Date>;

export type SessionResponse = SessionShape<string>;

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 Days

function toResponse(session: Session): SessionResponse {
  return {
    ...session,
    expires_at: session.expires_at.toISOString(),
    created_at: session.created_at.toISOString(),
    updated_at: session.updated_at.toISOString(),
  };
}

async function expireById(sessionId: string): Promise<Session> {
  if (!sessionId) {
    throw new UnauthorizedError({
      message: "User does not have an active session.",
      action: "Verify that this user is logged in and try again.",
    });
  }
  const revokedToken = await runUpdateQuery(sessionId);
  return revokedToken;

  async function runUpdateQuery(sessionId: string): Promise<Session> {
    const newExpiresAt = new Date();
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2, updated_at = $2
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, newExpiresAt],
    });
    return results.rows[0] as Session;
  }
}

async function create(userId: string): Promise<Session> {
  const token = crypto.randomBytes(48).toString("hex");
  const createAt = new Date();
  const expiresAt = new Date(createAt.getTime() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await runInsertQuery(token, userId, expiresAt, createAt);
  return newSession;

  async function runInsertQuery(
    token: string,
    userId: string,
    expiresAt: Date,
    createAt: Date,
  ): Promise<Session> {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $4)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt, createAt],
    });
    return results.rows[0] as Session;
  }
}

async function renew(sessionToken: string): Promise<Session> {
  const renewedSession = await runUpdateQuery(sessionToken);
  return renewedSession;

  async function runUpdateQuery(sessionToken: string): Promise<Session> {
    const newUpdatedAt = new Date();
    const newExpiresAt = new Date(
      newUpdatedAt.getTime() + EXPIRATION_IN_MILLISECONDS,
    );
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET 
          expires_at = $2,
          updated_at = $3
        WHERE
          token = $1
        RETURNING
          *
      ;`,
      values: [sessionToken, newExpiresAt, newUpdatedAt],
    });
    return results.rows[0];
  }
}
async function getValidSession(
  sessionToken: string | undefined,
): Promise<Session> {
  if (!sessionToken) throw new SessionNotFoundError();
  const validSession = await runSelectQuery(sessionToken);
  return validSession;

  async function runSelectQuery(sessionToken: string): Promise<Session> {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          sessions
        WHERE
          token = $1 
          AND 
          expires_at > timezone('utc', now())
      ;`,
      values: [sessionToken],
    });
    if (results.rowCount != null && results.rowCount === 0) {
      throw new UnauthorizedError({
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
      });
    }
    return results.rows[0];
  }
}

const session = {
  create,
  renew,
  expireById,
  getValidSession,
  toResponse,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
