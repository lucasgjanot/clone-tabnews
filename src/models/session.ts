import crypto from "node:crypto";
import database from "infra/database";

type Session = {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

const EXPIRATION_IN_MILISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 Days

async function create(userId: string): Promise<Session> {
  const token = crypto.randomBytes(48).toString("hex");
  const createAt = new Date();
  const expiresAt = new Date(createAt.getTime() + EXPIRATION_IN_MILISECONDS);
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
          sessions (token, user_id, expires_at, created_at)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt, createAt],
    });
    return results.rows[0] as Session;
  }
}

const session = {
  create,
  EXPIRATION_IN_MILISECONDS,
};

export default session;
