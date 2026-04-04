import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

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

  async loginUser(data: LoginRequest) {
    // 1. Sanitize input
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    // 2. Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((res) => res[0]);

    if (!user) {
      throw new Error("email atau password salah");
    }

    // 3. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("email atau password salah");
    }

    // 4. Generate token
    const token = crypto.randomUUID();

    // 5. Save session
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { data: token };
  }

  async getCurrentUser(token: string) {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1)
      .then((res) => res[0]);

    if (!result) {
      throw new Error("Unauthorized");
    }

    return { data: result };
  }
}

export const usersService = new UsersService();
