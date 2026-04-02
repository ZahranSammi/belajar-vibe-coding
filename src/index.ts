import { Elysia } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .get("/", () => ({
    message: "Hello from Elysia + Drizzle + PostgreSQL!",
    status: "ok",
  }))
  .get("/users", async () => {
    const allUsers = await db.select().from(users);
    return allUsers;
  })
  .post("/users", async ({ body }) => {
    const { name, email } = body as { name: string; email: string };
    const newUser = await db.insert(users).values({ name, email }).returning();
    return newUser[0];
  })
  .listen(3000);

console.log(
  `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);
