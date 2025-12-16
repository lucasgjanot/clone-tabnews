import user, { User } from "./user";
import password from "./password";
import { NotFoundError, UnauthorizedError } from "infra/errors";

async function getAuthenticatedUser(
  inputEmail: string,
  inputPassword: string,
): Promise<User> {
  try {
    const storedUser = await findUserByEmail(inputEmail);
    await validatePassword(inputPassword, storedUser.password);

    return storedUser;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Invalid credentials.",
        action: "Please check your username and password.",
        cause: err,
      });
    }
    throw err;
  }

  async function findUserByEmail(inputEmail: string): Promise<User> {
    let storedUser;

    try {
      storedUser = await user.getUserByEmail(inputEmail);
      return storedUser;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Incorrect email",
          action: "Verify data and try again",
        });
      }
      throw err;
    }
  }
  async function validatePassword(
    inputPassword: string,
    storedPassword: string,
  ) {
    const validPassword = await password.compare(inputPassword, storedPassword);

    if (!validPassword)
      throw new UnauthorizedError({
        message: "Incorrect password",
        action: "Verify data and try again",
      });
  }
}

const authenticator = {
  getAuthenticatedUser,
};

export default authenticator;
