type Config = {
  db: DatabaseConfig;
  environment: string;
};

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  database: string;
  password: string;
  databaseURL: string;
};

const db: DatabaseConfig = {
  host: envOrThrow("POSTGRES_HOST"),
  port: Number(envOrThrow("POSTGRES_PORT")),
  database: envOrThrow("POSTGRES_DB"),
  user: envOrThrow("POSTGRES_USER"),
  password: envOrThrow("POSTGRES_PASSWORD"),
  databaseURL: envOrThrow("DATABASE_URL"),
};

export const cfg: Config = {
  db,
  environment: process.env.NODE_ENV,
};

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
