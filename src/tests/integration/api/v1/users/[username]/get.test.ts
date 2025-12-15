import user from "models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[usermame]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const user1 = await orchestrator.createUser({
        username: "exactCase",
        email: "exactCase@example.com",
        password: "senha1234",
      });

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
      );
      expect(response2.status).toBe(200);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "exactCase",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      const userInDatabase = await user.getUserByUsername(
        response2Body.username,
      );
      expect(userInDatabase.email).toBe("exactCase@example.com");
    });
    test("With case mismatch", async () => {
      const user1 = await orchestrator.createUser({
        username: "mismatchcase",
        email: "mismatchcase@example.com",
        password: "senha1234",
      });

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username.toUpperCase()}`,
      );
      expect(response2.status).toBe(200);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "mismatchcase",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });
      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      const userInDatabase = await user.getUserByUsername(
        response2Body.username,
      );
      expect(userInDatabase.email).toBe("mismatchcase@example.com");
    });
    test("With nonexistent user", async () => {
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent",
      );
      expect(response2.status).toBe(404);
      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "'nonexistent' user not found",
        action: "Please check if the username is typed correctly",
        status_code: 404,
      });
    });
  });
});
