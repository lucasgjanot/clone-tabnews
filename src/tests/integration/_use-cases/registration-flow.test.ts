import { PublicUser } from "models/user";
import orchestrator from "tests/orchestrator";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@clone-tabnews.com.br",
          password: "senhasegura",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);

    const createdUser = await user.getUserByEmail(
      "registration.flow@clone-tabnews.com.br",
    );

    expect(createdUser.features).toEqual(["read:activation_token"]);

    const createUserResponseBody: PublicUser = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: createUserResponseBody.username,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });
  test("Receive activation email", async () => {});
  test("Activate account", async () => {});
  test("Login", async () => {});
  test("Get user information", async () => {});
});
