# Dokumentasi Teknis TTIWSA KPI Dashboard

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-4.0-38B2AC?logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)
![Security](https://img.shields.io/badge/Security-Strict-red)

## 1. Pendahuluan

Dokumen ini merupakan spesifikasi teknis definitif untuk **TTIWSA KPI Dashboard**. Dashboard ini dirancang secara khusus untuk pemantauan metrik operasional TTI, FFG, dan Garansi pada segmen Indihome serta Indibiz per area layanan (STO). Arsitektur dirancang untuk skalabilitas, keamanan tingkat tinggi, dan pemrosesan data real-time, menggunakan pendekatan serverless backend.

### 1.1. Fitur Komprehensif: Kawal 65 KPI (Eastern Region)
Selain metrik konvensional, dashboard ini mengintegrasikan fitur tambahan komprehensif **"Kawal 65 KPI"** yang dirancang khusus untuk memonitor dan menyeluruhi performa operasional pada 3 region utama di area Eastern: **Bogor, Bekasi, dan Karawang**. Seluruh modul pendukung (mulai dari analitik data hingga notifikasi Telegram) difokuskan secara eksklusif untuk mengawal ketat parameter kinerja di ketiga teritori krusial tersebut.

Dokumentasi ini bersifat final, presisi, dan disusun untuk meminimalisasi pertanyaan teknis di masa mendatang (future-proof & legacy-proof).

---

## 2. Arsitektur dan Teknologi

Proyek ini dibangun menggunakan susunan teknologi berikut. Harap perhatikan versi yang tertera untuk menghindari regresi kompabilitas:

- **Framework Utama:** Next.js `16.2.9` (App Router)
- **Library UI:** React `19.2.4` & React DOM `19.2.4`
- **Styling:** Tailwind CSS `v4` terintegrasi dengan PostCSS
- **Visualisasi Data:** Chart.js `4.5.1` & `react-chartjs-2` dengan plugin DataLabels
- **Manajemen Sesi / Keamanan:** 
  - `jose` `6.2.3` (JSON Web Token yang kompatibel dengan Vercel Edge)
  - `bcryptjs` (Hashing kata sandi admin)
  - `@upstash/redis` (Rate limiting in-memory terdistribusi)
- **Integrasi Eksternal:** 
  - Google Apps Script (GAS) / Google Sheets (Sebagai basis data primitif / data layer)
  - Telegram Bot API (Notifikasi otomatis via `/api/telegram/send`)
- **Utilitas Tambahan:** `html2canvas` & `html-to-image` (Untuk ekspor laporan ke dalam format gambar)

---

## 3. Topologi Sistem & Aliran Data

### 3.1. Logika Backend (Route Handlers)
Backend beroperasi sepenuhnya secara _serverless_ melalui arsitektur Next.js Route Handlers. Terdapat dua fungsi utama:
1. **Data Proxying (`/api/dashboard`, `/api/submit`)**: Backend bertindak sebagai proxy aman menuju antarmuka Google Apps Script (GAS) yang terhubung ke Google Sheets. Logika ini diimplementasikan untuk mencegah tereksposnya endpoint makro Google secara publik, sekaligus memberlakukan mekanisme cache pada level _Edge_.
2. **Validasi Formulir Integrasi**: Rute seperti `/submit/not-comply`, `/submit/ps-pi`, dan `/submit/unspec` memproses payload dari klien dan mengalirkannya ke GAS. Seluruh manipulasi bukti atau penolakan (_Reject/Accept Evidence_) harus divalidasi dengan token otorisasi admin sebelum disahkan oleh backend.

### 3.2. Logika Setup & Notifikasi Telegram
Modul notifikasi interaktif via Telegram (`/api/telegram/send`) beroperasi dengan logika keamanan tertutup:
1. **Otorisasi Rute**: Endpoint memverifikasi eksistensi dan validitas JWT Admin (menggunakan kunci rahasia pada env). Permintaan tanpa token otentikasi valid akan langsung ditolak (HTTP 401).
2. **Pengiriman Payload**: Jika otorisasi lolos, backend melakukan iterasi HTTP POST ke `https://api.telegram.org/bot<TOKEN>/sendMessage`.
3. **Pengaturan Penerima**: Pesan berformat _markdown_ dikirim secara simultan ke serangkaian `chat_id` yang dideklarasikan secara tertutup (seperti `TEST_CHAT_ID` dan `TEST_CHAT_ID2`).
4. **Setup**: Untuk mengatur integrasi ini, pengguna hanya perlu memastikan variabel lingkungan `TELEGRAM_BOT_TOKEN` dan ID Chat tujuan telah dikonfigurasi dengan benar melalui _environment variables_ platform hosting. Tidak ada _webhook_ eksternal yang dipasang; sistem murni menggunakan sistem pemanggilan satu arah (_one-way push notification_).

---

## 4. Keamanan

Keamanan tidak dapat dikompromikan. Sistem ini memberlakukan parameter berikut secara kaku:

1. **Autentikasi Edge JWT (`/api/login`)**: Menggunakan `jose`, JWT ditandatangani pada environment Vercel Edge dan disimpan murni di cookie dengan atribut `HttpOnly`, `Secure` (saat production), dan `SameSite=Strict`.
2. **Proteksi Brute-Force & Dictionary Attack**: Rute otentikasi diikat ke Redis (@upstash/redis). Pembatasan akses terjadi seketika setelah gagal login sebanyak 5 kali dalam periode 15 menit (lockout_minutes) berdasarkan identifikasi Header `x-forwarded-for`.
3. **Hashing Kriptografis**: Kata sandi untuk hak akses *Admin* dienkripsi secara one-way di sisi server menggunakan *bcrypt* dengan _salt_ yang dikelola internal.
4. **Validasi Aksi Sensitif**: Aksi memanipulasi bukti (Accept/Reject Evidence) ditolak di level proxy jika JWT Admin yang disertakan tidak valid, kedaluwarsa, atau tidak memiliki otorisasi penuh.
5. **Konfigurasi Headers**: Penyesuaian `next.config.ts` digunakan untuk menetapkan Content Security Policy (CSP) ketat dan menghapus pengenal server (seperti `X-Powered-By`).

---

## 5. Struktur Repositori

Memahami hierarki ini merupakan syarat absolut sebelum melakukan modifikasi:

```text
ttiwsa-dashboard-2026/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Layout UI Dashboard utama
│   │   │   └── submit/         # Komponen rute input form pengguna
│   │   ├── api/                # Route handlers backend (REST endpoints)
│   │   │   ├── dashboard/      # Endpoint agregasi dari GAS
│   │   │   ├── login/          # Endpoint validasi & redis rate limit
│   │   │   ├── logout/         # Invalidate token sesi
│   │   │   ├── submit/         # Validasi & proxy data input form
│   │   │   └── telegram/       # Rute pelaporan interaktif bot
│   │   ├── globals.css         # Konfigurasi Tailwind & Global Style
│   │   └── layout.tsx          # Konfigurasi Root Document
│   ├── components/             # Reusable React Server/Client Components
│   │   ├── dashboard/          # Kartu KPI, Grafik, DataTables
│   │   ├── layout/             # Topbar, Navbar, Interaktivitas menu
│   │   ├── ui/                 # Atomic UI components (Histogram, PieChart, dsb)
│   │   └── ThemeProvider/      # Konteks visual client-side (Dark Mode dll)
│   ├── lib/                    # Fungsi bantu murni (Constants, auth context)
│   └── types/                  # (Jika ada) Deklarasi tipe TypeScript global
├── .env.local                  # Environment Configuration (TIDAK MASUK VCS)
├── eslint.config.mjs           # Aturan Linter
├── next.config.ts              # Konfigurasi Vercel/Next (Turbo, Header)
├── package.json                # Daftar dependensi & npm scripts
└── postcss.config.mjs          # Konfigurasi PostCSS untuk integrasi Tailwind v4
```

---

## 6. Prosedur Pengembangan Lokal

Langkah-langkah berikut bersifat tetap dan dilarang dimodifikasi tanpa penyesuaian arsitektur inti.

1. **Inisialisasi Repositori**:
   ```bash
   git clone https://github.com/1leuk/ttiwsa-dashboard-2026.git
   cd ttiwsa-dashboard-2026
   npm install
   ```

2. **Kebutuhan Variabel Lingkungan (`.env.local`)**:
   Diperlukan file `.env.local` dengan kunci berikut untuk menjalankan sistem secara lokal.
   
   **PERINGATAN KRITIKAL**: Nilai variabel ini adalah *rahasia mutlak (secret)* yang tidak disertakan dalam repositori ini dan dipegang sepenuhnya secara eksklusif oleh pemilik sistem. Saat serah terima (_hand-off_), tim pengembang masa depan **HARUS** meminta variabel ini langsung dari pemilik, dan tidak dibenarkan untuk menanyakannya ke dalam sistem atau log publik.

   ```env
   ADMIN_USERNAME=...          # [SECRET]
   ADMIN_PASSWORD_HASH=...     # [SECRET] Harus dalam bentuk hash bcrypt
   JWT_SECRET=...              # [SECRET] String acak kriptografis
   UPSTASH_REDIS_REST_URL=...  # [SECRET]
   UPSTASH_REDIS_REST_TOKEN=...# [SECRET]
   TELEGRAM_BOT_TOKEN=...      # [SECRET]
   TEST_CHAT_ID=...            # [SECRET]
   TEST_CHAT_ID2=...           # [SECRET]
   ```
   *Catatan: Segala upaya menjalankan rute login tanpa variabel lingkungan yang disediakan oleh pemilik (secara offline/terenkripsi) akan memicu HTTP 500 secara _fail-safe_.*

3. **Menjalankan Server (Mode Development)**:
   ```bash
   npm run dev
   ```

4. **Pemeriksaan Kualitas Kode**:
   Pastikan linter tidak menampilkan galat sebelum commit.
   ```bash
   npm run lint
   ```

---

## 7. Instruksi Deployment (Vercel)

Sistem ini sangat dioptimalkan untuk Vercel. Penggunaan platform serverless lain mungkin memerlukan konfigurasi _adapter_ tambahan.

1. Hubungkan repositori GitHub ini ke Proyek Vercel.
2. Injeksi seluruh variabel lingkungan yang tertera pada tahap 6.2 ke dalam tab **Environment Variables** di Vercel (Pilih scope _Production_, _Preview_, & _Development_ yang sesuai).
3. Vercel akan otomatis mengenali Next.js App Router dan melakukan kompilasi fungsi menjadi Edge/Serverless.
4. Lakukan deploy ulang jika terdapat perubahan variabel lingkungan krusial, terutama `JWT_SECRET` atau `UPSTASH_REDIS`.

---

## 8. Penutup & Pemeliharaan

Dokumentasi ini ditulis untuk beroperasi tanpa pengawasan lebih lanjut.
Setiap perubahan pada arsitektur, seperti transisi dari Redis ke basis data SQL atau penggantian penyedia identitas, harus diikuti dengan revisi total pada dokumen ini. Gunakan panduan ini secara presisi sebagai satu-satunya standar sumber kebenaran teknis (Single Source of Truth) dari TTIWSA KPI Dashboard. 
