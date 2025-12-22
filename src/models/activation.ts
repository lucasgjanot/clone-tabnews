import email from "infra/email";
import { User } from "./user";
import database from "infra/database";
import webserver from "./webserver";

type ActivationToken = {
  id: string;
  used_at: Date | undefined;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function getAtivationTokenByUserId(
  userId: string,
): Promise<ActivationToken> {
  const activationToken = await runSelectQuery(userId);
  return activationToken;

  async function runSelectQuery(userId: string): Promise<ActivationToken> {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1`,
      values: [userId],
    });
    return results.rows[0];
  }
}

async function create(userId: string): Promise<ActivationToken> {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt, createdAt);
  return newToken;

  async function runInsertQuery(
    userId: string,
    expiresAt: Date,
    createdAt: Date,
  ): Promise<ActivationToken> {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at, created_at, updated_at)
        VALUES
          ($1, $2, $3, $3)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt, createdAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user: User, activationToken: ActivationToken) {
  await email.send({
    from: "Clone-Tabnews <contact@clone-tabnews.com.br>",
    to: user.email,
    subject: "Activate your account in Clone-TabNews!",
    text: `${user.username}, click on the link bellow to activate your account in Clone-TabNews:

${webserver.origin}/registration/activate/${activationToken.id}

Best regards,
Clone-TabNews Team`,
  });
}

const activation = {
  sendEmailToUser,
  create,
  getAtivationTokenByUserId,
};

export default activation;
