import { Elysia, t } from "elysia";
import { usersService } from "../services/users-service";

/**
 * Helper function: Mengekstrak string Bearer token dari Authorization header HTTP.
 * Mengembalikan null jika header kosong atau format tidak sesuai.
 * 
 * @param authHeader - String header Authorization.
 * @returns Token murni atau null.
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] || null;
}

export const usersRoute = new Elysia({ prefix: "/api" })
  /**
   * [POST] /api/users
   * Endpoint registrasi user baru.
   * Memvalidasi max length dari name dan email menghindari error skema di PosgreSQL.
   */
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
      detail: {
        tags: ["Users"],
        summary: "Register New User",
        description: "Creates a new user record in the database after validating constraints.",
      },
      response: {
        201: t.Object({ data: t.String() }),
        409: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  /**
   * [POST] /api/users/login
   * Endpoint log in pengguna untuk mendapatkan identitas token.
   */
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
      detail: {
        tags: ["Users"],
        summary: "User Login",
        description: "Authenticates credentials and returns a session token.",
      },
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  /**
   * [GET] /api/users/current
   * Endpoint pelindung untuk mengambil informasi si pengguna jika ia melampirkan Bearer token sah.
   */
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
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get Current Profile",
        description: "Fetch professional profile information based on an active session token.",
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            email: t.String(),
            createdAt: t.Date(),
          }),
        }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  )
  /**
   * [DELETE] /api/users/logout
   * Endpoint destuktif untuk menghapus eksistensi sesi login si pengguna dari database.
   */
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
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Logout User",
        description: "Revokes the session token and deletes it from the database.",
      },
      response: {
        200: t.Object({ data: t.String() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() }),
      },
    }
  );
