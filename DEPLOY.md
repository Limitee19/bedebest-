# Deploy BeDeBest — Checklist Klik-per-Klik

## A. GitHub (5 menit, sekali saja)

1. Buka github.com → New repository → nama `bedebest` (Private boleh) → Create.
2. Di laptop, jalankan dari folder `bedebest` (ganti USER):
   ```bash
   git remote add origin https://github.com/USER/bedebest.git
   git branch -M main
   git push -u origin main
   ```
   Login browser saat diminta. Hasil: kode v1 sudah di GitHub.

## B. Supabase (10 menit, sekali saja)

1. supabase.com → New project → catat **Project URL**, **anon key**,
   **service_role key** (Settings → API).
2. SQL Editor → New query → tempel seluruh `supabase/schema.sql` → Run.
   Hasil: tabel + RLS + trigger + 6 matkul + jadwal asli langsung jadi.
3. Di laptop: isi `.env.local` (URL + service_role), lalu:
   ```bash
   npm run seed:auth
   ```
   Hasil: 33 akun Auth + baris profiles (password = NIM). Aman diulang.

## C. Vercel (10 menit, sekali saja)

1. vercel.com → Add New → Project → Import repo `bedebest`.
2. Environment Variables (copy dari `.env.local` milikmu):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (opsional),
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `CRON_SECRET` = **wajib generate baru yang panjang** (jangan pakai yang di
   `.env.local` contoh).
3. Deploy → dapat URL `https://bedebest-xxx.vercel.app`.
4. Cron harian 00:00 WIB aktif otomatis dari `vercel.json`. Cek di dashboard:
   Project → Cron Jobs → harus ada `/api/cron/harian` sukses tiap malam.

## D. Go-live ke 33 anak (5 menit)

1. Share URL ke grup kelas.
2. Tiap anak: buka → pilih nama → isi NIM → masuk.
3. Tiap anak: ikon lonceng → **Nyalakan notif di HP** (1x saja).
4. Kamu sebagai admin: tunjuk 6 PJ + atur peserta matkul UNIV.
5. iPhone: wajib Add to Home Screen via Safari agar push bisa bunyi.

## Darurat

- Notifikasi tidak bunyi → cek Cron Jobs sukses? VAPID env benar? Izin situs?
- Lupa NIM/salah akun → Kelola Kelas → reset sandi (kembali ke NIM).
- Kunci bocor → regenerate di masing-masing dashboard, update env, redeploy.
