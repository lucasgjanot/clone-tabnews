import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user",
          email: "user@example.com",
          password: "senha1234",
        }),
      });
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "user",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      const userInDatabase = await user.getUserByUsername("user");
      const correctPasswordMatch = await password.compare(
        "senha1234",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
      expect(userInDatabase.email).toBe("user@example.com");
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedemail1",
          email: "duplicated@exemple.com",
          password: "senha1234",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedemail2",
          email: "Duplicated@exemple.com",
          password: "senha1234",
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "This email is already being used",
        action: "Use another email to continue",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicatedusername1",
          email: "duplicatedusername@exemple.com",
          password: "senha1234",
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "DuplicatedUsername1",
          email: "example@exemple.com",
          password: "senha1234",
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "This username is already being used",
        action: "Use another username to continue",
        status_code: 400,
      });
    });
  });
  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1sessionObject = await orchestrator.createSession(user1.id);

      const user2response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1sessionObject.token}`,
        },
        body: JSON.stringify({
          username: "loggedInUser",
          email: "loggedInUser@example.com",
          password: "senha1234",
        }),
      });
      expect(user2response.status).toBe(403);
      const user2responseBody = await user2response.json();
      expect(user2responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action:
          'Ensure that your user account has the required feature "create:user" before attempting this action.',
        status_code: 403,
      });
    });
  });
});
