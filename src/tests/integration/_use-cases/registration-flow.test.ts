import { PublicUserResponse } from "models/user";
import orchestrator from "tests/orchestrator";
import user from "models/user";
import activation from "models/activation";
import webserver from "models/webserver";
import { Session } from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody: PublicUserResponse;
  let activationTokenId: string | null;
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
          password: "securepassword",
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

    if (!lastEmail) throw new Error("Email not found");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

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
  test("Activate account", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );
    const responseBody = await response.json();
    expect(response.status).toBe(200);

    expect(responseBody).toEqual({
      id: activationTokenId,
      used_at: responseBody.used_at,
      user_id: createUserResponseBody.id,
      expires_at: responseBody.expires_at,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();
    expect(
      Date.parse(responseBody.updated_at) == Date.parse(responseBody.used_at),
    ).toBe(true);
    const activatedUser = await user.getUserByUsername(
      createUserResponseBody.username,
    );
    expect(activatedUser.features).toEqual(["create:session"]);
    expect(activatedUser.updated_at > activatedUser.created_at).toBe(true);
  });
  test("Login", async () => {
    const createSessionsResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@clone-tabnews.com.br",
          password: "securepassword",
        }),
      },
    );
    expect(createSessionsResponse.status).toBe(201);
    const createSessionsResponseBody: Session =
      await createSessionsResponse.json();
    expect(createSessionsResponseBody.user_id).toBe(createUserResponseBody.id);
  });
  test("Get user information", async () => {});
});
