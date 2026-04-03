import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .get("/", () => ({
    message: "Hello from Elysia + Drizzle + PostgreSQL!",
    status: "ok",
  }))
  .use(usersRoute)
  .listen(3000);

console.log(
  `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
);
