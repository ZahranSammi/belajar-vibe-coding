import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { resetDatabase } from "./helpers";

describe("Login API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should login successfully with valid credentials", async () => {
    // 1. Register first
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

    // 2. Login
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");
  });

  it("should fail with wrong password", async () => {
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

    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "wrongpassword",
        }),
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("email atau password salah");
  });

  it("should fail with non-existent email", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nobody@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("should fail with invalid email format", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });
});
