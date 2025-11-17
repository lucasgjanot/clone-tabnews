type Config = {
  db: DatabaseConfig;
  environment: string;
};

type DatabaseConfig = {
  host: string | undefined;
  port: number | undefined;
  user: string | undefined;
  database: string | undefined;
  password: string | undefined;
};

const db: DatabaseConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

export const cfg: Config = {
  db,
  environment: process.env.NODE_ENV,
};

//module.exports = { db };
