import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Belajar Vibe Coding API Documentation",
          version: "1.0.0",
          description: "Dokumentasi interaktif untuk aplikasi manajemen user.",
        },
        tags: [{ name: "Users", description: "Otentikasi dan Modul Pengguna" }],
      },
    })
  )
  .get("/", () => ({
    message: "Hello from Elysia + Drizzle + PostgreSQL!",
    status: "ok",
  }))
  .use(usersRoute);

if (import.meta.main) {
  app.listen(3000);
  console.log(
    `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}
