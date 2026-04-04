# Belajar Vibe Coding - User API

## Deskripsi Aplikasi (About)
Aplikasi ini adalah REST API backend sederhana untuk sistem manajemen otentikasi user. Fiturnya mencakup registrasi, login (pembuatan session token), mengambil data profil user yang sedang login, dan logout (penghapusan session dari sistem). 

## Technology Stack & Library
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Elysia JS](https://elysiajs.com/) (Web framework yang sangat cepat untuk ekosistem Bun)
- **Database**: PostgreSQL (diakses melalui package `pg`)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Validation**: [Zod](https://zod.dev/) & Built-in Elysia Type Validator (`t`)
- **Hashing**: `bcrypt` (untuk hashing keamanan password)
- **Testing**: `bun test` (Test runner bawaan dari Bun)

## Struktur Folder & Arsitektur (Architecture)
Aplikasi ini menerapkan pemisahan konteks yang disederhanakan:
```
├── drizzle.config.ts # Konfigurasi sinkronisasi skema database Drizzle
├── src
│   ├── index.ts      # Entry point aplikasi Elysia. Di-export public untuk mempermudah testing.
│   ├── db
│   │   ├── index.ts  # Inisiasi koneksi Pool Postgres dan instance Drizzle ORM.
│   │   └── schema.ts # Deklarasi skema tabel database dan tipenya.
│   ├── routes
│   │   └── users-route.ts # Layer Controller / Routing. Menangani URL, input request validator (Elysia), dan output HTTP Status / response JSON.
│   └── services
│       └── users-service.ts # Layer Model / Logic. Menampung verifikasi Zod tambahan dan menjalankan query ke PostgreSQL via Drizzle.
└── test
    ├── helpers.ts    # Fungsi utility testing seperti reset/truncate database.
    └── *.test.ts     # Kumpulan file unit testing berbagai API scenario.
```

## Schema Database
Aplikasi mensyaratkan dua tabel relasional berikut di PostgreSQL:

1. **`users`** (Tabel Pengguna)
   - `id` (Serial, Primary Key)
   - `name` (Varchar 255, Not Null)
   - `email` (Varchar 255, Not Null, Unique)
   - `password` (Varchar 255, Not Null, menyimpan hashed password)
   - `createdAt` (Timestamp, Default Now)

2. **`sessions`** (Tabel Sesi Login)
   - `id` (Serial, Primary Key)
   - `token` (Varchar 255, Not Null, Unique)
   - `userId` (Integer, Not Null, FK -> referensi ke `users.id`)
   - `createdAt` (Timestamp, Default Now)

## API endpoints

### 1. `POST /api/users` (Register Baru)
Mendaftarkan user baru ke sistem. Name dan email akan dipaksa agar maksimal 255 karakter sesuai di database.
- **Body Request**: `{ "name": "...", "email": "...", "password": "..." }`
- **Output Success**: HTTP `201 Created` | `{ "data": "OK" }`

### 2. `POST /api/users/login` (Login)
Otentikasi kredensial login. Jika valid, akan mengembalikan akses token session.
- **Body Request**: `{ "email": "...", "password": "..." }`
- **Output Success**: HTTP `200 OK` | `{ "data": "<session_token>" }`

### 3. `GET /api/users/current` (Get My Profile)
Mengambil detail informasi status user pada token yang divalidasi, tidak termasuk detail keamanan seperti kata sandi.
- **Headers Request**: `Authorization: Bearer <session_token>`
- **Output Success**: HTTP `200 OK` | `{ "data": { "id": 1, "name": "...", "email": "...", "createdAt": "..." } }`

### 4. `DELETE /api/users/logout` (Logout)
Menghancurkan session saat ini dari database.
- **Headers Request**: `Authorization: Bearer <session_token>`
- **Output Success**: HTTP `200 OK` | `{ "data": "OK" }`

---

## Cara Setup Project
Langkah instalasi awal sebelum menjalankan sistem:

1. Clone Repository ini ke lingkungan lokal Anda.
2. Install dependencies menggunakan `bun`:
   ```bash
   bun install
   ```
3. Salin/Atur file `.env` dan kaitkan variabel ke URL koneksi Postgres Anda:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/nama_db
   ```
4. Migrasikan / Push skema Drizzle langsung ke tabel Database:
   ```bash
   bun run db:push
   ```

## Cara Run Aplikasi
Jalankan live application server dalam _watch-mode_ ketika tahap development:
```bash
bun run dev
```
Atau run secara normal:
```bash
bun start
```
Server web akan otomatis _listen_ menerima _request_ di alamat `http://localhost:3000`.

## Cara Test Aplikasi
Jalankan *unit tools* untuk mendemonstrasikan kelancaran dan kestabilan skenario validasi endpoint.
> **Peringatan**: Semua script test berpotensi membersihkan (truncate) tabel yang dikonfigurasi melalui `.env` untuk konsisten memulai skenario pada database baru.

Ketikkan command berikut:
```bash
bun test
```
Laporan list skenario akan dimuat secara rinci dilayar konsol Anda.
