import session from "models/session";
import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";
import { version as uuidVersion } from "uuid";
import { UserResponse } from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("Retrieving the endpoint", async () => {
      const response = await fetch("http://localhost:3000/api/v1/user");

      const responseBody: UserResponse = await response.json();

      expect(response.status).toBe(403);
      console.log(responseBody);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action:
          'Ensure that your user account has the required feature "read:session" before attempting this action.',
        status_code: 403,
      });
    });
  });
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody: UserResponse = await response.json();

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        features: ["create:session", "read:session"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: activatedUser.updated_at.toISOString(),
      });

      const renewedSessionObject = await session.getValidSession(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.updated_at > renewedSessionObject.created_at,
      ).toBe(true);

      expect(
        renewedSessionObject.expires_at.getTime() -
          renewedSessionObject.updated_at.getTime(),
      ).toBe(session.EXPIRATION_IN_MILLISECONDS);

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true,
      );

      const cookieHeader = response.headers.get("set-cookie");

      expect(cookieHeader).toBeTruthy();

      const parsedSetCookie = setCookieParser(cookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
    test("With nonexistent session", async () => {
      const nonexistentToken =
        "1e348fed6fe6d31e437ea82048b1090253a49113716238699d8756741f5aa3db57c8e8adea99829375a66bcd137255c5";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      const responseBody: UserResponse = await response.json();

      expect(response.status).toBe(401);

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
        status_code: 401,
      });

      const cookieHeader = response.headers.get("set-cookie");
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
    });
    test("With expired session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const timeNow = new Date();
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(timeNow > sessionObject.expires_at).toBe(true);

      const responseBody: UserResponse = await response.json();

      expect(response.status).toBe(401);

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "User does not have an active session.",
        action: "Verify that this user is logged in and try again.",
        status_code: 401,
      });

      const cookieHeader = response.headers.get("set-cookie");
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
    });
    test("With halfway-expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS / 2),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithHalfwayExpiredSession",
      });

      await orchestrator.activateUser(createdUser);

      const sessionObject = await orchestrator.createSession(createdUser.id);
      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody: UserResponse = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithHalfwayExpiredSession",
        email: createdUser.email,
        password: createdUser.password,
        features: ["create:session", "read:session"],
        created_at: createdUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();

      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions

      const renewedSessionObject = await session.getValidSession(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);

      expect(
        renewedSessionObject.expires_at.getTime() -
          renewedSessionObject.updated_at.getTime(),
      ).toEqual(session.EXPIRATION_IN_MILLISECONDS);

      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set‑Cookie assertions

      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toBeTruthy();
      const parsedSetCookie = setCookieParser(cookieHeader as string, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
