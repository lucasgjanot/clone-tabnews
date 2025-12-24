import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database";
import migrator from "models/migrator";
import user, { NewUser, User } from "models/user";
import session, { Session } from "models/session";
import activation from "models/activation";

const EMAIL_HTTP_URL = "http://localhost:1080";

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(`${EMAIL_HTTP_URL}`);
      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(inputs: Partial<NewUser> = {}) {
  const newUser = await user.create({
    username:
      inputs.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: inputs.email || faker.internet.email(),
    password: inputs.password || faker.internet.password(),
  });
  return newUser;
}

async function createSession(user_id: string): Promise<Session> {
  const sessionObject = await session.create(user_id);
  return sessionObject;
}

async function deleteAllEmails() {
  await fetch(`${EMAIL_HTTP_URL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${EMAIL_HTTP_URL}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) return null;

  const emailTextResponse = await fetch(
    `${EMAIL_HTTP_URL}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();
  return { ...lastEmailItem, text: emailTextBody };
}

function extractUUID(text: string) {
  const pattern: RegExp =
    /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
  const result = text.match(pattern);
  return result ? result[1] : null;
}

async function activateUser(inactiveUser: User) {
  return await activation.activateUserByUserId(inactiveUser.id);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
  activateUser,
};

export default orchestrator;
