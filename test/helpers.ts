import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { sql } from "drizzle-orm";

export async function resetDatabase() {
  // Truncate tables and reset sequences to start from 1
  await db.execute(sql`TRUNCATE TABLE ${sessions}, ${users} RESTART IDENTITY CASCADE`);
}
