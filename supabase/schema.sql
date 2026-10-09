-- ============================================================
-- BeDeBest — skema Supabase untuk Offering B(EST) PBM
-- Cara pakai: Supabase Dashboard → SQL Editor → tempel seluruh file → Run
-- ============================================================

-- Aman dijalankan ulang: tidak menghapus data (IF NOT EXISTS + DROP POLICY IF EXISTS).
-- Bila mau reset total, hapus tabel manual dari Dashboard → Table Editor.
-- Profil terhubung ke auth.users. Email produksi: NIM@siswa.bedebest.id
-- (atau email asli untuk admin). Kata sandi awal = NIM.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  nim text not null unique,
  email text not null unique,
  role text not null default 'member' check (role in ('admin','pj','member'))
);

create table if not exists public.matkul (
  id text primary key,
  kode text not null unique,
  nama text not null,
  dosen text[] not null default '{}',
  sks int not null default 2,
  semester int not null default 1,
  kelompok text not null default 'B - B',
  -- Banyak sesi per matkul: [{"hari":"Senin","jam":"07:00 - 09:35","ruang":"..."}]
  jadwal jsonb not null default '[]',
  -- ID profil (auth.users.id) yang menjadi PJ khusus matkul ini
  pj_ids text[] not null default '{}',
  -- ID profil yang mengambil matkul ini. '{}' = seluruh kelas.
  -- Untuk matkul UNIV yang pesertanya beda kelompok.
  anggota_ids text[] not null default '{}',
  warna text not null default '#3f8fd1',
  kontrak text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.tugas (
  id text primary key,
  matkul_id text not null references public.matkul(id) on delete cascade,
  judul text not null check (char_length(judul) between 1 and 200),
  deskripsi text not null default '' check (char_length(deskripsi) <= 5000),
  deadline_at timestamptz not null,
  prioritas text not null default 'sedang' check (prioritas in ('rendah','sedang','mendesak')),
  status text not null default 'usulan' check (status in ('usulan','resmi','selesai')),
  dibuat_oleh text not null default '',
  -- ID auth.users pembuat (nullable untuk data lama). Dipakai policy hapus usulan sendiri.
  dibuat_oleh_id text,
  disimpulkan_oleh text,
  -- ID profil yang sudah menandai selesai. Progres bersifat PER AKUN:
  -- menandai selesai tidak mengubah apa pun bagi anggota lain.
  selesai_oleh text[] not null default '{}',
  -- Pertemuan ke berapa (opsional, untuk pengelompokan Bank Arsip)
  pertemuan int check (pertemuan is null or (pertemuan between 1 and 16)),
  -- true = masuk Bank Arsip, disembunyikan dari papan aktif
  arsip boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.catatan_tugas (
  id text primary key,
  matkul_id text not null references public.matkul(id) on delete cascade,
  tugas_id text references public.tugas(id) on delete set null,
  isi text not null check (char_length(isi) between 1 and 2000),
  oleh text not null default '',
  -- ID auth.users pembuat (nullable untuk data lama). Dipakai policy hapus sendiri.
  oleh_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.lampiran (
  id text primary key,
  tugas_id text not null references public.tugas(id) on delete cascade,
  tipe text not null default 'link' check (tipe in ('link','file')),
  url text not null,
  label text not null default ''
);

-- Cache rangkuman AI: 1 baris per periode, ditulis via service role / server
create table if not exists public.ai_summaries (
  id bigint generated always as identity primary key,
  periode text not null default 'mingguan',
  content_markdown text not null,
  model text not null default 'lokal',
  generated_at timestamptz not null default now()
);

-- Riwayat aktivitas kelas. Murah: ±150 byte/baris, batasi 120 baris terbaru
-- di aplikasi (atau cron hapus yang >90 hari). 120 baris ≈ 18 KB.
create table if not exists public.aktivitas (
  id text primary key,
  tipe text not null check (tipe in ('catatan','usulan','resmi','selesai','anggota','matkul')),
  teks text not null,
  oleh text not null default '',
  created_at timestamptz not null default now()
);

-- Subscription Web Push per perangkat. 1 user boleh banyak HP/laptop.
-- ±200 byte/baris — 30 user × 2 perangkat ≈ 12 KB. Sangat ringan.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.matkul enable row level security;
alter table public.tugas enable row level security;
alter table public.catatan_tugas enable row level security;
alter table public.lampiran enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.aktivitas enable row level security;
alter table public.push_subscriptions enable row level security;

-- Kolom baru hasil hardening: tambah bila tabel lama belum punya (aman rerun).
alter table public.tugas add column if not exists dibuat_oleh_id text;
alter table public.catatan_tugas add column if not exists oleh_id text;

-- Bersihkan policy lama agar file aman dijalankan ulang (tanpa hapus data).
drop policy if exists "baca_kelas" on public.profiles;
drop policy if exists "baca_kelas" on public.matkul;
drop policy if exists "baca_kelas" on public.tugas;
drop policy if exists "baca_kelas" on public.catatan_tugas;
drop policy if exists "baca_kelas" on public.lampiran;
drop policy if exists "baca_kelas" on public.ai_summaries;
drop policy if exists "baca_kelas" on public.aktivitas;
drop policy if exists "tulis_catatan" on public.catatan_tugas;
drop policy if exists "tulis_usulan" on public.tugas;
drop policy if exists "tulis_aktivitas" on public.aktivitas;
drop policy if exists "sub_milik_sendiri" on public.push_subscriptions;
drop policy if exists "profil_sendiri" on public.profiles;
drop policy if exists "admin_matkul" on public.matkul;
drop policy if exists "admin_tugas" on public.tugas;
drop policy if exists "admin_tugas_hapus" on public.tugas;
drop policy if exists "admin_profiles" on public.profiles;
drop policy if exists "hapus_usulan_sendiri" on public.tugas;
drop policy if exists "hapus_catatan_sendiri" on public.catatan_tugas;
drop policy if exists "admin_catatan_hapus" on public.catatan_tugas;
drop policy if exists "member_selesai" on public.tugas;
drop policy if exists "pj_tugas" on public.tugas;
drop policy if exists "pj_tugas_hapus" on public.tugas;
drop policy if exists "pj_catatan_hapus" on public.catatan_tugas;
drop policy if exists "pj_matkul" on public.matkul;

-- Semua anggota kelas yang login boleh baca semuanya
create policy "baca_kelas" on public.profiles for select to authenticated using (true);
create policy "baca_kelas" on public.matkul for select to authenticated using (true);
create policy "baca_kelas" on public.tugas for select to authenticated using (true);
create policy "baca_kelas" on public.catatan_tugas for select to authenticated using (true);
create policy "baca_kelas" on public.lampiran for select to authenticated using (true);
create policy "baca_kelas" on public.ai_summaries for select to authenticated using (true);
create policy "baca_kelas" on public.aktivitas for select to authenticated using (true);

-- Siapa pun yang login boleh menulis catatan & usulan.
-- dibuat_oleh_id / oleh_id wajib milik sendiri bila diisi (cegah spoofing),
-- dan usulan baru wajib berstatus 'usulan' (resmi hanya via finalisasi admin/PJ).
create policy "tulis_catatan" on public.catatan_tugas for insert to authenticated
  with check (oleh_id is null or oleh_id = auth.uid()::text);
create policy "tulis_usulan" on public.tugas for insert to authenticated
  with check (status = 'usulan' and (dibuat_oleh_id is null or dibuat_oleh_id = auth.uid()::text));
create policy "tulis_aktivitas" on public.aktivitas for insert to authenticated with check (true);

-- Subscription push ditulis server via service-role (melewati RLS),
-- jadi tidak ada policy tulis untuk klien. Baca dibatasi agar tiap user
-- hanya melihat miliknya sendiri (kolom user_id = auth.users.id versi teks).
create policy "sub_milik_sendiri" on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid()::text);

-- Update profil sendiri — TAPI role/nim/email dikunci trigger di bawah.
-- Tanpa trigger ini member bisa update role='admin' milik sendiri (eskalasi).
create policy "profil_sendiri" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.batasi_profil_role()
returns trigger language plpgsql as $$
begin
  if public.is_admin() then
    return NEW;
  end if;
  if NEW.role is distinct from OLD.role
     or NEW.nim is distinct from OLD.nim
     or NEW.email is distinct from OLD.email
     or NEW.id is distinct from OLD.id then
    raise exception 'Hanya admin yang boleh mengubah role / NIM / email';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_batasi_profil_role on public.profiles;
create trigger trg_batasi_profil_role
  before update on public.profiles for each row execute function public.batasi_profil_role();

-- Fungsi bantu: apakah saya admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Fungsi bantu: apakah saya PJ dari matkul ini?
create or replace function public.is_pj(mid text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.matkul
    where id = mid and auth.uid()::text = any(pj_ids)
  );
$$;

-- Hanya admin yang boleh kelola matkul & finalisasi tugas
create policy "admin_matkul" on public.matkul for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_tugas" on public.tugas for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_tugas_hapus" on public.tugas for delete to authenticated using (public.is_admin());
create policy "admin_profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pembuat boleh menghapus usulan / catatan miliknya sendiri.
-- Admin/PJ tetap lewat policy admin/pj di bawah + trigger.
create policy "hapus_usulan_sendiri" on public.tugas for delete to authenticated
  using (status = 'usulan' and dibuat_oleh_id = auth.uid()::text);
create policy "hapus_catatan_sendiri" on public.catatan_tugas for delete to authenticated
  using (oleh_id = auth.uid()::text);
create policy "admin_catatan_hapus" on public.catatan_tugas for delete to authenticated
  using (public.is_admin());

-- Anggota boleh update baris tugas HANYA untuk menandai selesai MILIK SENDIRI.
-- Trigger di bawah menegakkannya secara ketat (whitelist selesai_oleh + id sendiri).
create policy "member_selesai" on public.tugas for update to authenticated
  using (true) with check (true);

create or replace function public.batasi_tugas_member()
returns trigger language plpgsql as $$
declare
  saya text := auth.uid()::text;
  pj boolean := public.is_pj(NEW.matkul_id);
begin
  if public.is_admin() then
    return NEW;
  end if;
  -- PJ: boleh ubah isi tugas di matkulnya, TAPI dilarang menyentuh
  -- selesai_oleh orang lain (hanya boleh biarkan apa adanya).
  if pj then
    if NEW.selesai_oleh is distinct from OLD.selesai_oleh
       and not (
         -- PJ menandai miliknya sendiri: tepat 1 elemen berubah dan itu id sendiri
         (select count(*) from (select unnest(NEW.selesai_oleh) except select unnest(OLD.selesai_oleh)) d) +
         (select count(*) from (select unnest(OLD.selesai_oleh) except select unnest(NEW.selesai_oleh)) d) = 1
         and (saya = any(NEW.selesai_oleh) or saya = any(OLD.selesai_oleh))
         and (select array_agg(x order by x) from unnest(NEW.selesai_oleh) x where x <> saya)
           is not distinct from
           (select array_agg(x order by x) from unnest(OLD.selesai_oleh) x where x <> saya)
       ) then
      raise exception 'PJ dilarang mengubah progres selesai milik orang lain';
    end if;
    return NEW;
  end if;
  -- Anggota biasa: isi tugas TIDAK boleh berubah sama sekali.
  if NEW.matkul_id is distinct from OLD.matkul_id
     or NEW.judul is distinct from OLD.judul
     or NEW.deskripsi is distinct from OLD.deskripsi
     or NEW.deadline_at is distinct from OLD.deadline_at
     or NEW.prioritas is distinct from OLD.prioritas
     or NEW.status is distinct from OLD.status
     or NEW.pertemuan is distinct from OLD.pertemuan
     or NEW.arsip is distinct from OLD.arsip
     or NEW.dibuat_oleh is distinct from OLD.dibuat_oleh
     or NEW.dibuat_oleh_id is distinct from OLD.dibuat_oleh_id
     or NEW.disimpulkan_oleh is distinct from OLD.disimpulkan_oleh then
    raise exception 'Hanya admin/PJ yang boleh mengubah isi tugas';
  end if;
  -- selesai_oleh: hanya boleh tambah/hapus ID SENDIRI, tepat 1 perubahan.
  if NEW.selesai_oleh is distinct from OLD.selesai_oleh then
    if (select array_agg(x order by x) from unnest(NEW.selesai_oleh) x where x <> saya)
       is distinct from
       (select array_agg(x order by x) from unnest(OLD.selesai_oleh) x where x <> saya) then
      raise exception 'Hanya boleh mengubah status selesai milik sendiri';
    end if;
    if abs(array_length(NEW.selesai_oleh, 1) - array_length(OLD.selesai_oleh, 1)) is distinct from 1
       and not (OLD.selesai_oleh = '{}' and array_length(NEW.selesai_oleh, 1) = 1)
       and not (NEW.selesai_oleh = '{}' and array_length(OLD.selesai_oleh, 1) = 1) then
      raise exception 'Perubahan selesai_oleh tidak valid';
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_batasi_tugas_member on public.tugas;
create trigger trg_batasi_tugas_member
  before update on public.tugas for each row execute function public.batasi_tugas_member();

-- PJ boleh update baris tugas di matkulnya (finalisasi); trigger di atas
-- tetap melarang anggota biasa menyentuh selain selesai_oleh.
create policy "pj_tugas" on public.tugas for update to authenticated
  using (public.is_pj(matkul_id)) with check (public.is_pj(matkul_id));
-- PJ boleh hapus tugas & catatan di matkulnya (sesuai UI: admin/PJ kelola).
create policy "pj_tugas_hapus" on public.tugas for delete to authenticated
  using (public.is_pj(matkul_id));
create policy "pj_catatan_hapus" on public.catatan_tugas for delete to authenticated
  using (public.is_pj(matkul_id));

-- PJ boleh memperbarui info matkulnya (kontrak/jadwal), tapi tidak boleh
-- mengubah kode atau daftar PJ (itu wewenang admin).
create policy "pj_matkul" on public.matkul for update to authenticated
  using (public.is_pj(id)) with check (public.is_pj(id));

create or replace function public.batasi_matkul_pj()
returns trigger language plpgsql as $$
begin
  if public.is_admin() then
    return NEW;
  end if;
  if NEW.id is distinct from OLD.id
     or NEW.kode is distinct from OLD.kode
     or NEW.pj_ids is distinct from OLD.pj_ids then
    raise exception 'Hanya admin yang boleh mengubah kode / daftar PJ';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_batasi_matkul_pj on public.matkul;
create trigger trg_batasi_matkul_pj
  before update on public.matkul for each row execute function public.batasi_matkul_pj();

-- ============ SEED: 6 matkul Offering B(EST) PBM (sumber: PLM/plm.db) ============
-- ON CONFLICT DO NOTHING agar aman dijalankan ulang tanpa error duplikat.
insert into public.matkul (id, kode, nama, dosen, sks, semester, kelompok, jadwal, warna, kontrak) values
('mk-ppd','UNIV236012','Perkembangan Peserta Didik',array['Risa Safira Ramadhani'],3,1,'B9 - B9','[{"hari":"Senin","jam":"07:00 - 09:35","ruang":"Ruang A20-616 Ged A20"}]','#3f8fd1','Tahapan perkembangan kognitif, sosial-emosional, dan moral peserta didik. Tugas observasi 30%, UTS 30%, UAS 40%. Kehadiran minimal 75%.'),
('mk-pai','UNIV236001','Pendidikan Agama Islam',array['Nur Faizin'],3,1,'B30 - B30','[{"hari":"Senin","jam":"14:55 - 16:35","ruang":"Ruang A19-715 Ged A19"},{"hari":"Sabtu","jam":"07:00 - 10:25","ruang":"Ruang F2.1 Ged F2"}]','#2fa08a','Akhlak, ibadah, dan wawasan keislaman dalam profesi pendidik. Hafalan & praktik 25%, makalah kelompok 25%, UTS 20%, UAS 30%.'),
('mk-seni','PMDR236026','Kesenian Tiongkok',array['Siyu Sun'],2,1,'B - B','[{"hari":"Selasa","jam":"07:00 - 08:40","ruang":"Ruang D17.305 Ged D17"}]','#e8552f','Seni rupa, musik, dan pertunjukan Tiongkok. Wajib portofolio karya + presentasi kelompok pekan ke-14.'),
('mk-kaligrafi','PMDR236010','Kaligrafi Tiongkok',array['Yingzhen Lin'],2,1,'B - B','[{"hari":"Jumat","jam":"08:45 - 10:25","ruang":"Ruang A1-103 Ged A1"}]','#e75d8f','Goresan dasar, radikal, hingga karya kaligrafi utuh. Bawa brush & tinta sendiri mulai pekan 3. Penilaian 70% praktik.'),
('mk-plb','PMDR236009','Pemahaman Lintas Budaya',array['Min Gong'],2,1,'B - B','[{"hari":"Jumat","jam":"07:00 - 08:40","ruang":"Ruang A20-613 Ged A20"}]','#7c5cbf','Komunikasi lintas budaya Indonesia-Tiongkok, studi kasus, dan esai reflektif 1500 kata. Diskusi kelompok tiap pekan.'),
('mk-cc1','PMDR236001','Chinese Comprehensive 1',array['Yajun Lin','Amira Eza Febrian Putri'],8,1,'B - B','[{"hari":"Selasa","jam":"10:30 - 14:50","ruang":"Ruang A1-103 Ged A1"},{"hari":"Kamis","jam":"13:10 - 16:35","ruang":"Ruang A20-514 Ged A20"}]','#e9a13b','Matkul inti 8 SKS: kosakata, tata bahasa, membaca, percakapan dasar. Kuis tiap 2 pekan, UTS lisan + tulis. Target HSK 2.')
on conflict (id) do nothing;
