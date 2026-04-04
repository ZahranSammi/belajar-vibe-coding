# Rencana Penambahan Fitur Swagger API Documentation

## Deskripsi Tugas
Tugas ini bertujuan untuk mengintegrasikan dokumentasi API interaktif ke dalam project Elysia JS. Kita akan menggunakan plugin resmi agar dokumentasi otomatis di-generate berdasarkan skema (Zod/tipe bawaan Elysia `t`) dan routing yang sudah ada. Dengan begini, baik Frontend Developer maupun publik pengguna API dapat melakukan uji coba langsung ke endpoint `/swagger` melalui antarmuka web.

---

## Prasyarat Lingkungan
Pastikan Anda sedang berada pada root folder `belajar-vibe-coding` dan versi runtime `bun` Anda minimal 1.0 ke atas.

---

## Langkah-langkah Implementasi Detail

Ikuti instruksi ini secara berurutan dan hati-hati:

### Tahap 1: Instalasi Package Plugin
Buka terminal dan jalankan perintah instalasi dependency berikut:
```bash
bun add @elysiajs/swagger
```
Plugin ini secara otomatis menghubungkan framework Elysia dengan engine Swagger UI.

### Tahap 2: Mendaftarkan Plugin ke Entry Point
Buka file `src/index.ts`.
1. Pada bagian atas file, bersama dengan *import* lainnya, tambahkan import swagger:
   ```typescript
   import { swagger } from "@elysiajs/swagger";
   ```
2. Anda akan menemukan inisialisasi aplikasi seperti `const app = new Elysia()`. 
3. Daftarkan plugin swagger dengan fungsi `.use()`. **PENTING: Pastikan Anda memanggil `.use(swagger(...))` sebelum rute `.use(usersRoute)`.** Hal ini memastikan Swagger menangkap definisi rute setelahnya.
   
   *Contoh implementasi:*
   ```typescript
   export const app = new Elysia()
     .use(swagger({
       documentation: {
         info: {
           title: "Belajar Vibe Coding API Documentation",
           version: "1.0.0",
           description: "Dokumentasi interaktif untuk aplikasi manajemen user."
         },
         tags: [
           { name: "Users", description: "Otentikasi dan Modul Pengguna" }
         ]
       }
     }))
     .get("/", () => ({
       message: "Hello from Elysia + Drizzle + PostgreSQL!",
       status: "ok",
     }))
     .use(usersRoute);
   ```

### Tahap 3: Memberikan Metadata pada Routing (Opsional tapi Direkomendasikan)
Agar Swagger lebih rapi dan fungsional, kita bisa mengelompokkan API dengan `tags` atau mengatur header otorisasi. Buka file `src/routes/users-route.ts`.

1. Untuk setiap deklarasi rute `.post(...)`, `.get(...)`, `.delete(...)`, Anda akan melihat konfigurasi `body: t.Object(...)` di argumen terakhir.
2. Tambahkan variabel konfigurasi `detail` bersebelahan dengan `body` untuk keperluan dokumentasi.
   
   *Contoh pada Endpoint Login:*
   ```typescript
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Login Pengguna",
        description: "Digunakan untuk masuk dan mendapatkan token sesi yang valid."
      }
    }
   ```
3. Lakukan hal yang sama untuk endpoint Register, Get Current User, dan Logout, menggunakan `tags: ["Users"]` dan *summary* yang masuk akal.

### Tahap 4: Mengatur Header Authorization pada Swagger
Aplikasi kita menerima bearer token untuk akses `/api/users/current` dan `/api/users/logout`. Anda harus menambahkan pengaturan keamanan di `src/routes/users-route.ts` atau langsung di konfigurasi `swagger` sehingga tester bisa menginputkan Bearer token di antarmuka Swagger (opsional, ikuti dokumentasi `@elysiajs/swagger` bagian `security`).

### Tahap 5: Testing
Setelah berhasil, jalankan server web:
```bash
bun run dev
```

1. Buka browser dan arahkan ke alamat berikut: **`http://localhost:3000/swagger`**
2. Antarmuka UI Swagger harus terbuka tanpa error dan menampilkan setidaknya 4 API dari Users.
3. Coba isi parameter `email` dan `password` pada UI endpoint POST Register, lalu klik `Execute`. Anda harus melihat return HTTP 201.

Jika berjalan, commit kode tersebut dan ajukan Pull Request. Good luck!
