import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { resetDatabase } from "./helpers";

describe("Current User API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should return the current user with valid token", async () => {
    // 1. Register
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    // 2. Login to get token
    const loginRes = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "password123",
        }),
      })
    );
    const { data: token } = await loginRes.json();

    // 3. Get current user
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.email).toBe("john@example.com");
    expect(body.data.name).toBe("John Doe");
    expect(body.data.password).toBeUndefined(); // Ensure password is not returned
  });

  it("should fail without token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should fail with invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: "Bearer wrong-token" },
      })
    );

    expect(response.status).toBe(401);
  });
});
