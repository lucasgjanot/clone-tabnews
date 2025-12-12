type Config = {
  db: DatabaseConfig;
  environment: string;
  api: APIConfig;
};

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  database: string;
  password: string;
};

type APIConfig = {
  pepper: string;
};
const db: DatabaseConfig = {
  host: envOrThrow("POSTGRES_HOST"),
  port: Number(envOrThrow("POSTGRES_PORT")),
  database: envOrThrow("POSTGRES_DB"),
  user: envOrThrow("POSTGRES_USER"),
  password: envOrThrow("POSTGRES_PASSWORD"),
};

const api: APIConfig = {
  pepper: envOrThrow("PEPPER"),
};

const cfg: Config = {
  db,
  environment: process.env.NODE_ENV,
  api,
};

export default cfg;

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
