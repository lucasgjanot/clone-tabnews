import session from "models/session";
import crypto from "node:crypto";
import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With nonexistant/empty session", async () => {
      const nonexistantToken = crypto.randomBytes(48).toString("hex");
      const response1 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: { Cookie: `session_id=${nonexistantToken}` },
      });

      const response1Body = await response1.json();

      expect(response1.status).toBe(401);

      expect(response1Body).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
        status_code: 401,
      });
    });
    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const user1 = await orchestrator.createUser({
        username: "expiredSession",
      });

      const expiredSessionObject = await orchestrator.createSession(user1.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: { Cookie: `session_id=${expiredSessionObject.token}` },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
        status_code: 401,
      });
    });
    test("With valid session", async () => {
      const user1 = await orchestrator.createUser({
        username: "validSession",
      });

      const sessionObject = await orchestrator.createSession(user1.id);

      const response1 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: { Cookie: `session_id=${sessionObject.token}` },
      });
      const response1Body = await response1.json();

      expect(response1.status).toBe(200);

      expect(response1Body).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: user1.id,
        expires_at: response1Body.expires_at,
        created_at: sessionObject.created_at.toISOString(),
        updated_at: response1Body.expires_at,
      });

      expect(
        response1Body.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);

      expect(
        response1Body.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      expect(new Date(response1Body.expires_at) < new Date()).toBe(true);

      const cookieHeader = response1.headers.get("set-cookie");

      expect(cookieHeader).toBeTruthy();

      const parsedSetCookie = setCookieParser(cookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      const response2 = await fetch("http://localhost:3000/api/v1/user", {
        headers: { Cookie: `session_id=${sessionObject.token}` },
      });
      const response2Body = await response2.json();

      expect(response2.status).toBe(401);
      expect(response2Body).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
        status_code: 401,
      });
    });
  });
});
