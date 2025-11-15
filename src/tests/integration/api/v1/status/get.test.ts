describe("API GET TESTS", () => {
  test("GET on /api/v1/status should return 200 and OK JSON", async () => {
    const response = await fetch("http://localhost:3000/api/v1/status");
    const statusCode = response.status;
    const responseJson = await response.json();

    expect(statusCode).toBe(200);
    expect(responseJson).toEqual({ APIstatus: "OK", DBstatus: "OK" });
  });
});
