import database from "infra/database";
import { ValidationError } from "infra/errors";

export type User = {
  uuid: string;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
};

export type NewUser = Pick<User, "username" | "email" | "password">;
export type PublicUser = Omit<User, "password">;

function getPublicUser(user: User): PublicUser {
  const { uuid, username, email, created_at, updated_at } = user;
  return { uuid, username, email, created_at, updated_at };
}

async function create(userInputValues: NewUser): Promise<User> {
  const { username, email, password } = userInputValues;
  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await runInsertQuery(username, email, password);
  return newUser;

  async function validateUniqueUsername(username: string) {
    const results = await database.query({
      text: `
      SELECT 
        username 
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
      values: [username],
    });
    if (results.rowCount != null && results.rowCount > 0) {
      throw new ValidationError({
        message: "This username is already being used",
        action: "Use another username to complete sign in",
      });
    }
  }

  async function validateUniqueEmail(email: string) {
    const results = await database.query({
      text: `
      SELECT 
        email 
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
      values: [email],
    });
    if (results.rowCount != null && results.rowCount > 0) {
      throw new ValidationError({
        message: "This email is already being used",
        action: "Use another email to complete sign in",
      });
    }
  }

  async function runInsertQuery(
    username: string,
    email: string,
    password: string,
  ) {
    const newUser = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING
        *
      ;`,
      values: [username, email, password],
    });
    return newUser.rows[0];
  }
}

const user = {
  create,
  getPublicUser,
};

export default user;
