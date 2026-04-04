import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

// Helper function to extract Bearer token from Authorization header
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] || null;
}

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

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
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

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get(
    "/users/current",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers.authorization);

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const result = await usersService.getCurrentUser(token);
        return result;
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    }
  )
  .delete(
    "/users/logout",
    async ({ headers, set }) => {
      const token = extractBearerToken(headers.authorization);

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const result = await usersService.logout(token);
        return result;
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        // Server/database error — don't mask as 401
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    }
  );
