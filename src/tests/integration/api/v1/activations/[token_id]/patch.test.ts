import activation, { ActivationTokenResponse } from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymouns user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/activations/256bc49a-132a-42e4-8334998fd17ee71e",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "The activation token has already been used, was not found in the system, or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });
      const createdUser = await orchestrator.createUser();
      const activationTokenObject = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "The activation token has already been used, was not found in the system, or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With alreaty used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationTokenObject = await activation.create(createdUser.id);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response2.status).toBe(404);
      const responseBody = await response2.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "The activation token has already been used, was not found in the system, or has expired.",
        action: "Please register again.",
        status_code: 404,
      });
    });
    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();

      const activationTokenObject = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody: ActivationTokenResponse = await response.json();

      expect(responseBody).toEqual({
        id: activationTokenObject.id,
        user_id: activationTokenObject.user_id,
        used_at: responseBody.used_at,
        expires_at: activationTokenObject.expires_at.toISOString(),
        created_at: activationTokenObject.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(responseBody.user_id).toBe(createdUser.id);

      expect(Date.parse(responseBody.used_at as string)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(
        new Date(responseBody.created_at) < new Date(responseBody.updated_at),
      ).toBe(true);

      expect(responseBody.updated_at).toBe(responseBody.updated_at);

      expect(
        new Date(responseBody.used_at as string) <
          new Date(responseBody.expires_at),
      ).toBe(true);

      const createdAt = new Date(responseBody.created_at);
      const expiredAt = new Date(responseBody.expires_at);
      expect(expiredAt.getTime() - createdAt.getTime()).toBe(
        activation.EXPIRATION_IN_MILLISECONDS,
      );

      const activatedUser = await user.getUserByUserId(responseBody.user_id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });
    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationTokenObject = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenObject.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody: ActivationTokenResponse = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "User account is already activated.",
        action: "Contact support if this is unexpected.",
        status_code: 403,
      });
    });
    describe("Default user", () => {
      test("With valid token, but already logged in user", async () => {
        const user1 = await orchestrator.createUser();
        await orchestrator.activateUser(user1);
        const user1sessionObject = await orchestrator.createSession(user1.id);

        const user2 = await orchestrator.createUser();
        const user2activationToken = await activation.create(user2.id);

        const response = await fetch(
          `http://localhost:3000/api/v1/activations/${user2activationToken.id}`,
          {
            method: "PATCH",
            headers: {
              Cookie: `session_id=${user1sessionObject.token}`,
            },
          },
        );

        expect(response.status).toBe(403);
        const responseBody: ActivationTokenResponse = await response.json();
        expect(responseBody).toEqual({
          name: "ForbiddenError",
          message: "You do not have permission to perform this action.",
          action:
            'Ensure that your user account has the required feature "read:activation_token" before attempting this action.',
          status_code: 403,
        });
      });
    });
  });
});
