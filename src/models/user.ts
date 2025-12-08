import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";

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

export function getPublicUser(user: User): PublicUser {
  const { password, ...publicFields } = user;
  return publicFields;
}

async function getUserByUsername(username: string): Promise<User> {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username: string): Promise<User> {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT 
        1
      ;`,
      values: [username],
    });

    if (results.rowCount != null && results.rowCount === 0) {
      throw new NotFoundError({
        message: `'${username}' user not found`,
        action: "Please check if the username is typed correctly",
      });
    }
    const userFound: User = results.rows[0];
    return userFound;
  }
}

async function create(userInputValues: NewUser): Promise<User> {
  const { username, email, password } = userInputValues;
  await validateUniqueEmail(email);
  await validateUniqueUsername(username);

  const newUser = await runInsertQuery(username, email, password);
  return newUser;

  async function validateUniqueUsername(username: string): Promise<void> {
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

  async function validateUniqueEmail(email: string): Promise<void> {
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
  ): Promise<User> {
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
    return newUser.rows[0] as User;
  }
}

const user = {
  create,
  getPublicUser,
  getUserByUsername,
};

export default user;
