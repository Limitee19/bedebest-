"use client";

import { supabase } from "./supabase";
import {
  ADMIN_EMAIL,
  ADMIN_NIM,
  namaRapi,
  seedUsers,
  type Aktivitas,
  type Catatan,
  type Matkul,
  type Tautan,
  type Tugas,
  type User,
} from "./data";

export interface CloudData {
  users: User[];
  matkul: Matkul[];
  tugas: Tugas[];
  catatan: Catatan[];
  tautan: Tautan[];
  aktivitas: Aktivitas[];
}

const emailDariNim = (nim: string) =>
  nim === ADMIN_NIM ? ADMIN_EMAIL : `${nim}@siswa.bedebest.id`;

const nimDariNama = (nama: string) => {
  const k = nama.trim().toLowerCase();
  return seedUsers().find((u) => u.nama.toLowerCase() === k)?.nim ?? "";
};

type Row = Record<string, unknown>;

export type CloudRow = Row;
const s = (v: unknown, fb = "") => (typeof v === "string" ? v : fb);
const aStr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function mapUser(r: Row): User {
  const nim = s(r.nim);
  return {
    id: s(r.id),
    nama: s(r.nama),
    nim,
    email: s(r.email) || (nim ? emailDariNim(nim) : ""),
    password: nim,
    role: r.role === "admin" ? "admin" : r.role === "pj" ? "pj" : "member",
  };
}

function mapMatkul(r: Row): Matkul {
  let jadwal: Matkul["jadwal"] = [];
  try {
    const j = Array.isArray(r.jadwal) ? r.jadwal : JSON.parse(s(r.jadwal, "[]"));
    if (Array.isArray(j)) {
      jadwal = j
        .filter((x) => x && typeof x === "object")
        .map((x) => {
          const o = x as Row;
          return { hari: s(o.hari), jam: s(o.jam), ruang: s(o.ruang) };
        });
    }
  } catch {
    jadwal = [];
  }
  return {
    id: s(r.id),
    kode: s(r.kode),
    nama: s(r.nama),
    dosen: aStr(r.dosen),
    sks: num(r.sks) ?? 2,
    semester: num(r.semester) ?? 1,
    kelompok: s(r.kelompok, "B - B"),
    jadwal,
    pjIds: aStr(r.pj_ids),
    anggotaIds: aStr(r.anggota_ids),
    warna: s(r.warna, "#3f8fd1"),
    kontrak: s(r.kontrak),
  };
}

function mapTugas(r: Row): Tugas {
  let subtask: Tugas["subtask"] = [];
  try {
    const raw = Array.isArray(r.subtask) ? r.subtask : JSON.parse(s(r.subtask, "[]"));
    if (Array.isArray(raw)) {
      subtask = raw
        .filter((x) => x && typeof x === "object")
        .map((x) => {
          const o = x as Row;
          return {
            label: s(o.label).slice(0, 200),
            done: typeof o.done === "boolean" ? o.done : undefined,
            doneOleh: aStr(o.doneOleh ?? o.done_oleh),
          };
        });
    }
  } catch {
    subtask = [];
  }
  return {
    id: s(r.id),
    matkulId: s(r.matkul_id),
    judul: s(r.judul),
    deskripsi: s(r.deskripsi),
    deadline: s(r.deadline_at, new Date().toISOString()),
    prioritas:
      r.prioritas === "mendesak" || r.prioritas === "rendah" ? r.prioritas : "sedang",
    status: r.status === "resmi" ? "resmi" : "usulan",
    dibuatOleh: s(r.dibuat_oleh),
    dibuatOlehId: s(r.dibuat_oleh_id) || undefined,
    disimpulkanOleh: s(r.disimpulkan_oleh) || undefined,
    subtask,
    selesaiOleh: aStr(r.selesai_oleh),
    pertemuan: num(r.pertemuan),
    arsip: r.arsip === true,
  };
}

function mapCatatan(r: Row): Catatan {
  return {
    id: s(r.id),
    matkulId: s(r.matkul_id),
    tugasId: s(r.tugas_id) || undefined,
    isi: s(r.isi),
    oleh: s(r.oleh),
    olehId: s(r.oleh_id) || undefined,
    createdAt: s(r.created_at, new Date().toISOString()),
  };
}

function mapTautan(r: Row): Tautan {
  const kat = s(r.kategori);
  return {
    id: s(r.id),
    matkulId: s(r.matkul_id),
    judul: s(r.judul),
    url: s(r.url),
    kategori: kat === "kumpul" || kat === "materi" || kat === "data" ? kat : "lainnya",
    deskripsi: s(r.deskripsi),
    oleh: s(r.oleh),
    olehId: s(r.oleh_id) || undefined,
    createdAt: s(r.created_at, new Date().toISOString()),
  };
}

function mapAktivitas(r: Row): Aktivitas {
  const tipe = s(r.tipe);
  return {
    id: s(r.id),
    tipe:
      tipe === "catatan" || tipe === "usulan" || tipe === "resmi" || tipe === "selesai" ||
      tipe === "anggota" || tipe === "matkul" || tipe === "tautan"
        ? (tipe as Aktivitas["tipe"])
        : "catatan",
    teks: s(r.teks),
    oleh: s(r.oleh),
    waktu: s(r.created_at, new Date().toISOString()),
  };
}

export async function cloudMuatSemua(): Promise<CloudData | null> {
  const sb = supabase();
  if (!sb) return null;
  try {
    const [u, m, t, c, l, a] = await Promise.all([
      sb.from("profiles").select("id,nama,nim,email,role").order("nama"),
      sb.from("matkul").select("*"),
      sb.from("tugas").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("catatan_tugas").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("tautan").select("*").order("created_at", { ascending: false }).limit(300),
      sb.from("aktivitas").select("*").order("created_at", { ascending: false }).limit(120),
    ]);
    if (u.error || m.error) return null;
    return {
      users: ((u.data ?? []) as Row[]).map(mapUser),
      matkul: ((m.data ?? []) as Row[]).map(mapMatkul),
      tugas: ((t.data ?? []) as Row[]).map(mapTugas),
      catatan: ((c.data ?? []) as Row[]).map(mapCatatan),
      tautan: ((l.data ?? []) as Row[]).map(mapTautan),
      aktivitas: ((a.data ?? []) as Row[]).map((r) => {
        const x = mapAktivitas(r);
        return { ...x, waktu: x.waktu };
      }),
    };
  } catch {
    return null;
  }
}

export function cloudSubscribe(cb: () => void) {
  const sb = supabase();
  if (!sb) return () => {};
  const ch = sb
    .channel("bedebest-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "matkul" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "tugas" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "catatan_tugas" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "tautan" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "aktivitas" }, cb)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, cb)
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

export async function cloudLogin(nama: string, sandi: string) {
  const sb = supabase();
  if (!sb) return { error: "Cloud belum dikonfigurasi." };
  const nim = nimDariNama(nama) || sandi.trim();
  const email = emailDariNim(nim);
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: sandi.trim(),
  });
  if (error || !data.user) return { error: "Nama atau kata sandi salah." };
  const { data: prof } = await sb
    .from("profiles")
    .select("id,nama,nim,email,role")
    .eq("id", data.user.id)
    .single();
  if (!prof) {
    await sb.auth.signOut();
    return { error: "Akun belum terdaftar di kelas. Hubungi admin." };
  }
  const u = mapUser(prof as Row);
  return { user: { ...u, nama: u.nama || namaRapi(nama) } as User };
}

export async function cloudLogout() {
  try {
    await supabase()?.auth.signOut();
  } catch {
    /* abaikan */
  }
}

export async function cloudGantiPassword(baru: string) {
  const sb = supabase();
  if (!sb) return "Cloud belum dikonfigurasi.";
  const { error } = await sb.auth.updateUser({ password: baru.trim() });
  return error ? "Gagal ganti sandi di cloud. Coba lagi." : null;
}

export async function cloudAmbilUser(): Promise<User | null> {
  const sb = supabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return null;
    const { data: prof } = await sb
      .from("profiles")
      .select("id,nama,nim,email,role")
      .eq("id", uid)
      .single();
    if (!prof) return null;
    return mapUser(prof as Row);
  } catch {
    return null;
  }
}

type Tbl = "matkul" | "tugas" | "catatan_tugas" | "tautan" | "aktivitas" | "profiles";

export async function cloudUpsert(tbl: Tbl, row: Row) {
  try {
    await supabase()?.from(tbl).upsert(row, { onConflict: "id" });
  } catch {
    /* offline — data lokal tetap tersimpan */
  }
}

export async function cloudHapus(tbl: Tbl, id: string) {
  try {
    await supabase()?.from(tbl).delete().eq("id", id);
  } catch {
    /* abaikan */
  }
}

export const keRowMatkul = (m: Matkul): Row => ({
  id: m.id,
  kode: m.kode,
  nama: m.nama,
  dosen: m.dosen,
  sks: m.sks,
  semester: m.semester,
  kelompok: m.kelompok,
  jadwal: m.jadwal,
  pj_ids: m.pjIds ?? [],
  anggota_ids: m.anggotaIds ?? [],
  warna: m.warna,
  kontrak: m.kontrak,
});

export const keRowTugas = (t: Tugas): Row => ({
  id: t.id,
  matkul_id: t.matkulId,
  judul: t.judul,
  deskripsi: t.deskripsi,
  deadline_at: t.deadline,
  prioritas: t.prioritas,
  status: t.status,
  dibuat_oleh: t.dibuatOleh,
  dibuat_oleh_id: t.dibuatOlehId ?? null,
  disimpulkan_oleh: t.disimpulkanOleh ?? null,
  selesai_oleh: t.selesaiOleh ?? [],
  subtask: (t.subtask ?? []).map((x) => ({
    label: x.label,
    doneOleh: x.doneOleh ?? [],
  })),
  pertemuan: t.pertemuan ?? null,
  arsip: !!t.arsip,
});

export const keRowCatatan = (c: Catatan): Row => ({
  id: c.id,
  matkul_id: c.matkulId,
  tugas_id: c.tugasId ?? null,
  isi: c.isi,
  oleh: c.oleh,
  oleh_id: c.olehId ?? null,
});

export const keRowTautan = (t: Tautan): Row => ({
  id: t.id,
  matkul_id: t.matkulId,
  judul: t.judul,
  url: t.url,
  kategori: t.kategori,
  deskripsi: t.deskripsi,
  oleh: t.oleh,
  oleh_id: t.olehId ?? null,
});

export const keRowAktivitas = (a: Aktivitas): Row => ({
  id: a.id,
  tipe: a.tipe,
  teks: a.teks,
  oleh: a.oleh,
});
