# TóngBǎn 同班 — Papan Tugas Offering B(EST) PBM

Web pengelolaan tugas sekelas: 33 akun dengan sesi login masing-masing, 6 matkul
dikelola admin, alur **catatan → tugas resmi** oleh PJ/admin, deadline serinci
mungkin, plus dasbor **Rangkuman Cerdas** (Gemini, dengan fallback otomatis lokal).

## Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` → pilih **nama** dari daftar, isi **NIM** sebagai
kata sandi. 33 akun dengan sesi B(EST) PBM sudah terdaftar. Admin: Muhammad Ariel
Fathoni / NIM `260242649788`.

Tanpa `.env` pun aplikasi jalan penuh memakai data lokal (localStorage).

## Pindah ke Supabase (produksi, 33 user)

1. Buat project di supabase.com → SQL Editor → jalankan `supabase/schema.sql`
   (tabel + RLS + 6 matkul Offering B(EST) PBM langsung keseed).
2. Authentication → Users → buat 33 user dengan email `<NIM>@siswa.tongban.id`
   (admin: `muhammadarielfathoni12@gmail.com`), password = NIM masing-masing.
   Setiap user baru wajib punya baris di `profiles` (`id` = `auth.users.id`,
   `nim` = NIM, `role` = admin hanya untuk NIM 260242649788).
3. Salin `.env.example` → `.env.local`, isi `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan opsional `GEMINI_API_KEY`
   (dari https://aistudio.google.com/apikey).
4. Deploy ke Vercel: import repo → tambah env yang sama → deploy.

Kapasitas: 33 user tidak ada apa-apanya bagi Supabase free tier
(50 ribu MAU, 500 MB database).

## Notifikasi & riwayat

- **Lonceng** di sidebar/header: deadline H-3…H-0 (hanya tugas yang belum
  *kamu* selesaikan) + jadwal kuliah hari ini (nama, jam, ruang).
- **Notifikasi HP**: tekan "Nyalakan notif di HP" di panel lonceng. Aplikasi
  memeriksa tiap 60 detik — begitu ganti hari (melewati 00:00), pengingat
  harian + jadwal hari itu muncul sebagai notifikasi sistem. Yang sudah
  menandai selesai tidak diganggu.
- **Riwayat kelas** (`/aktivitas`): semua kejadian (catatan, usulan, tugas
  resmi, penyelesaian, anggota, matkul). Murah: ±150 byte per baris, aplikasi
  menyimpan 120 terbaru (±18 KB). Di Supabase: tabel `aktivitas`, opsional
  cron hapus yang berumur >90 hari.
- Batasan jujur: notifikasi muncul saat aplikasi pernah dibuka (service worker
  terdaftar agar bisa di-install sebagai PWA). Notifikasi push yang tiba walau
  aplikasi   *tidak pernah dibuka* butuh tahap 2: VAPID keys + cron server
  (misal Supabase Edge Function terjadwal) — fondasinya sudah disiapkan.

## Matkul UNIV yang pesertanya beda-beda

Matkul PMDR diambil seluruh kelas. Untuk matkul UNIV (kadang beda kelompok per
anak): Kelola Kelas → **Peserta per Mata Kuliah** → centang hanya anak yang
mengambilnya. Yang tidak ikut otomatis tidak melihat matkul, tugas, jadwal,
notifikasi, maupun rangkumannya. Bila kelompoknya beda jadwal/dosen (misal PAI
B31), tambah matkul baru dengan kelompok + jadwal sendiri + peserta sendiri.

## Deploy ke Vercel (produksi)

1. Push folder ini ke GitHub → Vercel → Import.
2. Isi Environment Variables (jangan commit!):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (server saja), `GEMINI_API_KEY` (opsional),
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `CRON_SECRET` (string acak ≥32 karakter).
3. Cron harian 00:00 WIB otomatis aktif via `vercel.json`
   (`0 17 * * *` UTC). Vercel mengirim `Authorization: Bearer CRON_SECRET`
   otomatis — penyerang tidak bisa memicu ledakan push.
4. Jalankan `supabase/schema.sql` sekali di SQL Editor (tabel + RLS + seed).
5. Tiap HP: buka web → Masuk → lonceng → **Nyalakan notif di HP** (1x saja).
   Setelah itu notifikasi deadline H-3…H-1 + jadwal 00:00 bunyi walau web
   tertutup. iPhone: buka via Safari → Share → Add to Home Screen dulu
   (syarat push di iOS).

## Keamanan (status sebelum deploy)

Yang sudah dipasang di aplikasi:

- **Header**: `DENY` framing (anti clickjacking), `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` minimal, HSTS.
- **Rate limit** `middleware.ts`: 30 req/menit/IP untuk semua `/api/*`.
- **Cap Gemini**: 15 rangkuman AI/hari/IP, selebihnya fallback lokal gratis.
- **Cron terkunci** `CRON_SECRET` (401 tanpa secret).
- **Kunci privat tidak pernah ke klien**: `GEMINI_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY` tanpa prefix
  `NEXT_PUBLIC_`. `.env*` di-gitignore.
- **Supabase RLS**: baca sekelas, tulis catatan/usulan bebas, finalisasi +
  kelola matkul hanya admin, `selesai_oleh` dijaga trigger.
- **Validasi input** di endpoint push (bentuk subscription dicek ketat).

Jujur soal **DDoS**: banjir traffic level jaringan (L3/L4/L7 besar) tidak bisa
ditahan oleh kode aplikasi — itu tugas platform. Vercel (tempat deploy ini)
punya mitigasi DDoS + Edge Network bawaan; itu sudah cukup untuk skala
ancaman web kelas. Kalau nanti butuh lebih (WAF kustom, challenge bot),
pasang Cloudflare gratis di depan domain — tanpa ubah kode.

## Struktur

- `app/` — login, dasbor, matkul + detail (kontrak/dosen/jadwal/catatan/finalisasi),
  papan tugas, kalender mingguan, kelola kelas (admin), API rangkuman
- `components/` — shell, kartu matkul, baris tugas, kartu AI, logo
- `lib/` — data benih, store (localStorage, siap diganti query Supabase),
  konektor Supabase, peringkas lokal + Gemini
- `supabase/schema.sql` — skema + RLS + seed

## Desain

Arah visual: **Editorial Akademik — Buku Agenda**. Kertas hangat, tinta tegas,
satu aksen hijau papan tulis, cap prioritas ala stempel, angka tabular.
Font: Plus Jakarta Sans (asli Indonesia) + Fraunces + JetBrains Mono.
Tanpa gradient ungu, tanpa glassmorphism, tanpa emoji ikon.
