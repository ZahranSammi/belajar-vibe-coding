import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export class UsersService {
  async registerUser(data: RegisterRequest) {
    // 1. Sanitize input
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    // 2. Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("email sudah ada di database");
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert user
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { data: "OK" };
  }
}

export const usersService = new UsersService();
