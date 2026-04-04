import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must not exceed 255 characters"),
  email: z.string().email("Invalid email format").max(255, "Email must not exceed 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must not exceed 255 characters"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export class UsersService {
  /**
   * Mendaftarkan pengguna (user) baru ke dalam sistem.
   * Fungsi ini melakukan sanitasi input, mengecek apakah email sudah terdaftar,
   * melakukan hashing pada password untuk keamanan, dan menyimpannya ke database.
   * 
   * @param data - Objek request yang berisi name, email, dan password.
   * @returns Pesan konfirmasi objek {"data": "OK"}.
   */
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

  /**
   * Mengotentikasi pengguna dan membuat sesi baru.
   * Fungsi ini memverifikasi keberadaan email dan mencocokkan password dengan hash di database.
   * Jika berhasil, akan men-generate token (UUID) dan menyimpannya di tabel sessions.
   * 
   * @param data - Objek request yang berisi email dan password.
   * @returns Token sesi login {"data": "<token>"}.
   */
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

  /**
   * Mengambil profil pengguna yang sedang login berdasarkan token sesi.
   * Fungsi ini melakukan penggabungan (JOIN) antara tabel sessions dan users 
   * dan memastikan hanya me-return data esensial seperti id, name, email.
   * 
   * @param token - Bearer token aktif dari header pengguna.
   * @returns Data profil user (tanpa password) di dalam objek {"data": {...}}.
   */
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

  /**
   * Menghapus sesi aktif pengguna berdasarkan token.
   * Menghapus baris/record pada tabel sessions di database,
   * yang secara efektif mencabut akses rahasia (logout).
   * 
   * @param token - Bearer token aktif.
   * @returns Pesan konfirmasi objek {"data": "OK"}.
   */
  async logout(token: string) {
    // 1. Delete session matching the provided token
    const deletedSession = await db
      .delete(sessions)
      .where(eq(sessions.token, token))
      .returning({ token: sessions.token });

    // 2. If no session was found, the token is invalid
    if (deletedSession.length === 0) {
      throw new Error("Unauthorized");
    }

    // 3. Return success
    return { data: "OK" };
  }
}

export const usersService = new UsersService();
