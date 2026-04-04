import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { resetDatabase } from "./helpers";

describe("Logout API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should logout successfully with valid token", async () => {
    // 1. Register and login
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

    // 2. Logout
    const logoutRes = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(logoutRes.status).toBe(200);
    const body = await logoutRes.json();
    expect(body.data).toBe("OK");

    // 3. Verify token is gone by trying to use it
    const currentRes = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(currentRes.status).toBe(401);
  });

  it("should fail to logout with an already used or invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: "Bearer non-existent-token" },
      })
    );

    expect(response.status).toBe(401);
  });
});
