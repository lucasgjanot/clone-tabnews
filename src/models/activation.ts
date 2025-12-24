import email from "infra/email";
import user, { User } from "./user";
import database from "infra/database";
import webserver from "./webserver";
import { NotFoundError } from "infra/errors/errors";

export type ActivationTokenShape<TDate> = {
  id: string;
  used_at?: TDate;
  user_id: string;
  expires_at: TDate;
  created_at: TDate;
  updated_at: TDate;
};

export type ActivationToken = ActivationTokenShape<Date>;
export type ActivationTokenResponse = ActivationTokenShape<string>;

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function activateUserByUserId(userId: string): Promise<User> {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
  return activatedUser;
}

async function markTokenAsUsed(
  ActivationTokenId: string,
): Promise<ActivationToken> {
  const usedActivationToken = await runUpdateQuery(ActivationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(tokenId: string): Promise<ActivationToken> {
    const now = new Date();
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = $2,
          updated_at = $2
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [tokenId, now],
    });
    return results.rows[0];
  }
}

function toResponse(token: ActivationToken): ActivationTokenResponse {
  return {
    id: token.id,
    user_id: token.user_id,
    used_at: token.used_at?.toISOString(),
    expires_at: token.expires_at.toISOString(),
    created_at: token.created_at.toISOString(),
    updated_at: token.updated_at.toISOString(),
  };
}

async function getValidAtivationToken(
  tokenId?: string,
): Promise<ActivationToken> {
  if (!tokenId) {
    throw new NotFoundError({
      message: "Activation token not provided",
      action: "Please register again.",
    });
  }
  const activationToken = await runSelectQuery(tokenId);
  return activationToken;

  async function runSelectQuery(tokenId: string): Promise<ActivationToken> {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1 and used_at IS NULL and expires_at > timezone('utc', now())
      ;`,
      values: [tokenId],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "The activation token has already been used, was not found in the system, or has expired.",
        action: "Please register again.",
      });
    }
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
  getValidAtivationToken,
  markTokenAsUsed,
  toResponse,
  activateUserByUserId,
};

export default activation;
