type Config = {
  db: DatabaseConfig;
  environment: string;
  api: APIConfig;
  mailer: MailerConfig;
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

type MailerConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
};

const mailer: MailerConfig = {
  host: envOrThrow("EMAIL_SMTP_HOST"),
  port: Number(envOrThrow("EMAIL_SMTP_PORT")),
  user: envOrThrow("EMAIL_SMTP_USER"),
  password: envOrThrow("EMAIL_SMTP_PASSWORD"),
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
  mailer,
};

export default cfg;

function envOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
