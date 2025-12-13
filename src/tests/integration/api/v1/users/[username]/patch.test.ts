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
    test("Without/Empty body", async () => {
      const user1 = await orchestrator.createUser({
        username: "testuser",
        email: "testuser@example.com",
        password: "password",
      });
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
        "http://localhost:3000/api/v1/users/nonexistent",
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
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
        email: "user1@exemple.com",
        password: "senha1234",
      });
      const user2 = await orchestrator.createUser({
        username: "user2",
        email: "user2@exemple.com",
        password: "senha1234",
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
        username: "email1",
        email: "email1@example.com",
        password: "senha1234",
      });
      const user2 = await orchestrator.createUser({
        username: "email2",
        email: "email2@example.com",
        password: "senha1234",
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
      const user1 = await orchestrator.createUser({
        username: "uniqueUser1",
        email: "uniqueUser1@exemple.com",
        password: "senha1234",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
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
        username: "uniqueEmail1",
        email: "uniqueEmail1@exemple.com",
        password: "senha1234",
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
        username: "uniqueEmail1",
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
        username: "newPassword1",
        email: "newPassword1@exemple.com",
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
        username: "newPassword1",
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
