import { describe, expect, it, beforeEach } from "bun:test";
import { app } from "../src/index";
import { resetDatabase } from "./helpers";

describe("Registration API", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("should register a new user successfully", async () => {
    const response = await app.handle(
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

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ data: "OK" });
  });

  it("should fail validation if name is missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  it("should fail validation if email is invalid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "not-an-email",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  it("should fail if password is too short", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "short",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  it("should fail if name or email exceeds 255 characters", async () => {
    const longName = "a".repeat(256);
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: longName,
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(422);
  });

  it("should return 409 if email is already registered", async () => {
    // Register first user
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

    // Try to register again with same email
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "john@example.com",
          password: "password456",
        }),
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("email sudah ada di database");
  });
});
