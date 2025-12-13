import password from "models/password";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[usermame]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "existent",
          }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "'nonexistent' user not found",
        action: "Please check if the username is typed correctly",
        status_code: 404,
      });
    });
    test("Without/Empty body", async () => {
      const user1 = await orchestrator.createUser();
      const response1 = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );
      const response1Body = await response1.json();
      expect(response1.status).toBe(400);
      expect(response1Body).toEqual({
        name: "ValidationError",
        message: "Missing required parameters",
        action: "Adjust sent data and try again",
        status_code: 400,
      });

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
        },
      );
      const response2Body = await response2.json();
      expect(response2.status).toBe(400);
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "Missing required parameters",
        action: "Adjust sent data and try again",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });
      const user2 = await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "user1",
          }),
        },
      );
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "This username is already being used",
        action: "Use another username to continue",
        status_code: 400,
      });
    });
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@example.com",
      });
      const user2 = await orchestrator.createUser({
        email: "email2@example.com",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1@example.com",
          }),
        },
      );
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "This email is already being used",
        action: "Use another email to continue",
        status_code: 400,
      });
    });
    test("With unique 'username'", async () => {
      await orchestrator.createUser({
        username: "uniqueUser1",
      });
      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        uuid: responseBody.uuid,
        username: "uniqueUser2",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
    test("With unique 'email'", async () => {
      const user1 = await orchestrator.createUser({
        email: "uniqueEmail1@exemple.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueEmail2@example.com",
          }),
        },
      );
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        uuid: responseBody.uuid,
        username: user1.username,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      const userInDatabase = await user.getUserByUsername(
        responseBody.username,
      );
      expect(userInDatabase.email).toBe("uniqueEmail2@example.com");
    });
    test("With new 'password'", async () => {
      const user1 = await orchestrator.createUser({
        password: "newPassword1",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        uuid: responseBody.uuid,
        username: user1.username,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      const userInDatabase = await user.getUserByUsername(
        responseBody.username,
      );

      expect(
        await password.compare("newPassword2", userInDatabase.password),
      ).toBe(true);

      expect(
        await password.compare("newPassword1", userInDatabase.password),
      ).toBe(false);
    });
  });
});
