import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const app = new Elysia()
  .get("/", () => ({
    message: "Hello from Elysia + Drizzle + PostgreSQL!",
    status: "ok",
  }))
  .get("/users", async () => {
    return await db.select().from(users);
  })
  .post(
    "/users",
    async ({ body }) => {
      const newUser = await db.insert(users).values(body).returning();
      return newUser[0];
    },
    {
      body: userSchema,
    }
  )
  .put(
    "/users/:id",
    async ({ params: { id }, body, set }) => {
      const updatedUser = await db
        .update(users)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(users.id, Number(id)))
        .returning();

      if (updatedUser.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }

      return updatedUser[0];
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: userSchema.partial(),
    }
  )
  .delete(
    "/users/:id",
    async ({ params: { id }, set }) => {
      const deletedUser = await db
        .delete(users)
        .where(eq(users.id, Number(id)))
        .returning();

      if (deletedUser.length === 0) {
        set.status = 404;
        return { message: "User not found" };
      }

      return { message: "User deleted successfully", user: deletedUser[0] };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);
