import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
};

export type NewUser = Pick<User, "username" | "email" | "password">;
export type PublicUser = Omit<User, "email" | "password">;

export function getPublicUser(user: User): PublicUser {
  const { email, password, ...publicFields } = user;
  return publicFields;
}

async function getUserByUserId(user_id: string): Promise<User> {
  const userFound = await runSelectQuery(user_id);
  return userFound;

  async function runSelectQuery(user_id: string): Promise<User> {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
      ;`,
      values: [user_id],
    });
    if (results.rowCount != null && results.rowCount === 0) {
      throw new NotFoundError({
        message: `'${user_id}' user not found`,
        action: "Please check if the user_id is typed correctly",
      });
    }
    return results.rows[0];
  }
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

async function getUserByEmail(email: string): Promise<User> {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email: string): Promise<User> {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT 
          1
      ;`,
      values: [email],
    });

    if (results.rowCount != null && results.rowCount === 0) {
      throw new NotFoundError({
        message: `'${email}' user not found`,
        action: "Please check if the username is typed correctly",
      });
    }
    const userFound: User = results.rows[0];
    return userFound;
  }
}

async function create(userInputValues: NewUser): Promise<User> {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newData = { ...userInputValues };
  await hashedPasswordInObjecto(newData);

  const newUser = await runInsertQuery(newData);
  return newUser;

  async function runInsertQuery(newData: NewUser): Promise<User> {
    const results = await database.query({
      text: `
        INSERT INTO 
          users (username, email, password) 
        VALUES 
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [newData.username, newData.email, newData.password],
    });
    return results.rows[0] as User;
  }
}

async function update(
  username: string,
  params: Partial<NewUser>,
): Promise<User> {
  const currentUser = await getUserByUsername(username);
  if (params.username) {
    if (
      currentUser.username.toLowerCase() !== params.username.toLocaleLowerCase()
    ) {
      await validateUniqueUsername(params.username);
    }
  }
  if (params.email) {
    await validateUniqueEmail(params.email);
  }

  const updateData: Partial<NewUser> = {
    ...params,
  };

  if (updateData.password) {
    await hashedPasswordInObjecto(updateData);
  }
  const userWithNewValues = { ...currentUser, ...updateData };
  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues: User): Promise<User> {
    const result = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3, 
          password = $4,
          updated_at = timezone('utc', now())
        WHERE
          id=$1
        RETURNING
          *
      ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });
    return result.rows[0] as User;
  }
}

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
      action: "Use another username to continue",
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
      action: "Use another email to continue",
    });
  }
}

async function hashedPasswordInObjecto(updateData: Partial<NewUser>) {
  if (updateData.password) {
    updateData.password = await password.hash(updateData.password);
  }
}

const user = {
  create,
  update,
  getPublicUser,
  getUserByUsername,
  getUserByEmail,
  getUserByUserId,
};

export default user;
