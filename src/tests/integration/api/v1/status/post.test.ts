import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Sending request", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });
      expect(response.status).toBe(405);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        message: "'POST' method not allowed in this endpoint",
        action: "Verify if sent HTTP method is allowed in this endpoint",
        status_code: 405,
      });
    });
  });
});
