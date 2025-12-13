import bcryptjs from "bcryptjs";
import cfg from "config";

const PEPPER = cfg.api.pepper;

async function hash(password: string) {
  const ROUNDS = cfg.environment === "production" ? 14 : 1;
  const hashedPassword = await bcryptjs.hash(password + PEPPER, ROUNDS);
  return hashedPassword;
}

async function compare(password: string, storedHash: string) {
  return await bcryptjs.compare(password + PEPPER, storedHash);
}

const password = {
  hash,
  compare,
};

export default password;
