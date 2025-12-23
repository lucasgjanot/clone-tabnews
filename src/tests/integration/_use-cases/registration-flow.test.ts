import { PublicUser } from "models/user";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import activation from "models/activation";
import webserver from "models/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody: PublicUser;
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

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: createUserResponseBody.username,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    const activationTokenId = orchestrator.extractUUID(lastEmail.text);

    if (!activationTokenId) throw new Error("UUID not found in email");

    const activationToken =
      await activation.getValidAtivationToken(activationTokenId);

    expect(activationToken.user_id).toBe(createUserResponseBody.id);
    expect(activationToken.used_at).toBe(null);
    expect(activationToken.expires_at > new Date()).toBe(true);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/registration/activate/${activationTokenId}`,
    );
    expect(lastEmail.sender).toBe("<contact@clone-tabnews.com.br>");
    expect(lastEmail.recipients[0]).toBe(
      "<registration.flow@clone-tabnews.com.br>",
    );
    expect(lastEmail.subject).toBe("Activate your account in Clone-TabNews!");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(activationToken.id);
  });
  test("Activate account", async () => {});
  test("Login", async () => {});
  test("Get user information", async () => {});
});
