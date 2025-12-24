import session from "models/session";
import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        password: "correctpassword",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect.email@example.com",
          password: "correctpassword",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid credentials.",
        action: "Please check your username and password.",
        status_code: 401,
      });
    });
    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "correct.email@example.com",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correct.email@example.com",
          password: "incorrectpassword",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid credentials.",
        action: "Please check your username and password.",
        status_code: 401,
      });
    });
    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser({});
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect.email@example.com",
          password: "incorrectpassword",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Invalid credentials.",
        action: "Please check your username and password.",
        status_code: 401,
      });
    });
    test("With correct `email` and correct `password`", async () => {
      const user1 = await orchestrator.createUser({
        password: "correctpassword",
      });
      await orchestrator.activateUser(user1);
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user1.email,
          password: "correctpassword",
        }),
      });
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: user1.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      const createAt = new Date(responseBody.created_at);
      const expiresAt = new Date(responseBody.expires_at);
      expect(expiresAt.getTime() - createAt.getTime()).toBe(
        session.EXPIRATION_IN_MILLISECONDS,
      );
      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toBeTruthy();
      const parsedSetCookie = setCookieParser(cookieHeader as string, {
        map: true,
      });
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
