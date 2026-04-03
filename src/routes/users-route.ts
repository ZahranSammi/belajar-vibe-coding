import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api" })
  .post(
    "/users",
    async ({ body, set }) => {
      try {
        const result = await usersService.registerUser(body as any);
        set.status = 201;
        return result;
      } catch (error: any) {
        if (error.message === "email sudah ada di database") {
          set.status = 409;
          return { error: error.message };
        }
        
        // Handle database unique constraint error if service check missed it
        if (error.code === '23505' || error.message?.includes('unique constraint')) {
          set.status = 409;
          return { error: "email sudah ada di database" };
        }

        set.status = 400;
        return { error: "invalid request body" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    "/users/login",
    async ({ body, set }) => {
      try {
        const result = await usersService.loginUser(body as any);
        return result;
      } catch (error: any) {
        if (error.message === "email atau password salah") {
          set.status = 401;
          return { error: error.message };
        }

        set.status = 400;
        return { error: "invalid request body" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  );
