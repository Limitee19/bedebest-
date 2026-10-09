export type Role = "admin" | "pj" | "member";
export type StatusTugas = "usulan" | "resmi" | "selesai";
export type Prioritas = "rendah" | "sedang" | "mendesak";

export interface User {
  id: string;
  nama: string;
  nim: string;
  email: string;
  password: string;
  role: Role;
}

export interface Jadwal {
  hari: string;
  jam: string;
  ruang: string;
}

export interface Matkul {
  id: string;
  kode: string;
  nama: string;
  dosen: string[];
  sks: number;
  semester: number;
  kelompok: string;
  /** Satu matkul bisa punya banyak sesi (mis. PAI Senin + Sabtu). */
  jadwal: Jadwal[];
  /** ID user yang menjadi PJ khusus matkul ini. */
  pjIds: string[];
  /**
   * ID user yang mengambil matkul ini. Kosong = seluruh kelas.
   * Dipakai untuk matkul UNIV yang pesertanya beda-beda per kelompok.
   */
  anggotaIds: string[];
  warna: string;
  kontrak: string;
}

export interface Tugas {
  id: string;
  matkulId: string;
  judul: string;
  deskripsi: string;
  deadline: string; // ISO
  prioritas: Prioritas;
  status: StatusTugas;
  dibuatOleh: string;
  /** ID user pembuat — kepemilikan dicek pakai ini, bukan nama. */
  dibuatOlehId?: string;
  disimpulkanOleh?: string;
  /** Progres subtask bersifat PER AKUN: doneOleh = id user yang mencentang. */
  subtask: { label: string; done?: boolean; doneOleh?: string[] }[];
  /** ID user yang sudah menandai selesai — progres bersifat PER AKUN, bukan global. */
  selesaiOleh?: string[];
  /** Pertemuan ke berapa (1, 2, 3, …). Opsional, untuk pengelompokan arsip. */
  pertemuan?: number;
  /** true = masuk Bank Arsip, disembunyikan dari papan aktif. */
  arsip?: boolean;
}

export interface Catatan {
  id: string;
  matkulId: string;
  tugasId?: string;
  isi: string;
  oleh: string;
  /** ID user pembuat — kepemilikan dicek pakai ini, bukan nama. */
  olehId?: string;
  createdAt: string;
}

/** Tautan penting: GDrive kumpul tugas, spreadsheet nilai, dsb. */
export type KategoriTautan = "kumpul" | "materi" | "data" | "lainnya";

export interface Tautan {
  id: string;
  /** "" = milik kelas (tampil di /tautan). Isi matkulId = milik matkul tsb. */
  matkulId: string;
  judul: string;
  url: string;
  kategori: KategoriTautan;
  deskripsi: string;
  oleh: string;
  olehId?: string;
  createdAt: string;
}

export const LABEL_KATEGORI: Record<KategoriTautan, string> = {
  kumpul: "Link kumpul",
  materi: "Materi",
  data: "Data kelas",
  lainnya: "Lainnya",
};

/** URL aman untuk tautan: wajib http(s), tolak javascript:/data:/file:. */
export function urlAman(raw: string): string | null {
  const u = raw.trim().slice(0, 2000);
  if (!u) return null;
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed.toString();
}

/** Label domain pendek untuk badge, mis. "docs.google.com". */
export function domainDari(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").slice(0, 40);
  } catch {
    return "";
  }
}

export type TipeAktivitas =
  | "catatan"
  | "usulan"
  | "resmi"
  | "selesai"
  | "anggota"
  | "matkul"
  | "tautan";

export interface Aktivitas {
  id: string;
  tipe: TipeAktivitas;
  teks: string;
  oleh: string;
  waktu: string; // ISO
}

export const KELAS = "Offering B(EST) PBM";
export const ADMIN_EMAIL = "muhammadarielfathoni12@gmail.com";
export const ADMIN_NIM = "260242649788";

/** "ADINDA FAIZATUL AISYAH" → "Adinda Faizatul Aisyah" */
export function namaRapi(nama: string) {
  return nama
    .toLowerCase()
    .split(/\s+/)
    .map((k) => (k ? k[0].toUpperCase() + k.slice(1) : k))
    .join(" ");
}

export const seedMatkul: Matkul[] = [
  {
    id: "mk-ppd",
    kode: "UNIV236012",
    nama: "Perkembangan Peserta Didik",
    dosen: ["Risa Safira Ramadhani"],
    sks: 3,
    semester: 1,
    kelompok: "B9 – B9",
    jadwal: [{ hari: "Senin", jam: "07:00 – 09:35", ruang: "Ruang A20-616 Ged A20" }],
    pjIds: [],
    anggotaIds: [],
    warna: "#3f8fd1",
    kontrak:
      "Fokus pada tahapan perkembangan kognitif, sosial-emosional, dan moral peserta didik. Penilaian: tugas observasi 30%, UTS 30%, UAS 40%. Kehadiran minimal 75%.",
  },
  {
    id: "mk-pai",
    kode: "UNIV236001",
    nama: "Pendidikan Agama Islam",
    dosen: ["Nur Faizin"],
    sks: 3,
    semester: 1,
    kelompok: "B30 – B30",
    jadwal: [
      { hari: "Senin", jam: "14:55 – 16:35", ruang: "Ruang A19-715 Ged A19" },
      { hari: "Sabtu", jam: "07:00 – 10:25", ruang: "Ruang F2.1 Ged F2" },
    ],
    pjIds: [],
    anggotaIds: [],
    warna: "#2fa08a",
    kontrak:
      "Akhlak, ibadah, dan wawasan keislaman dalam profesi pendidik. Penilaian: hafalan & praktik 25%, makalah kelompok 25%, UTS 20%, UAS 30%.",
  },
  {
    id: "mk-seni",
    kode: "PMDR236026",
    nama: "Kesenian Tiongkok",
    dosen: ["Siyu Sun"],
    sks: 2,
    semester: 1,
    kelompok: "B – B",
    jadwal: [{ hari: "Selasa", jam: "07:00 – 08:40", ruang: "Ruang D17.305 Ged D17" }],
    pjIds: [],
    anggotaIds: [],
    warna: "#e8552f",
    kontrak:
      "Pengenalan seni rupa, musik, dan pertunjukan Tiongkok. Wajib portofolio karya + presentasi kelompok di pekan ke-14.",
  },
  {
    id: "mk-kaligrafi",
    kode: "PMDR236010",
    nama: "Kaligrafi Tiongkok",
    dosen: ["Yingzhen Lin"],
    sks: 2,
    semester: 1,
    kelompok: "B – B",
    jadwal: [{ hari: "Jumat", jam: "08:45 – 10:25", ruang: "Ruang A1-103 Ged A1" }],
    pjIds: [],
    anggotaIds: [],
    warna: "#e75d8f",
    kontrak:
      "Latihan goresan dasar (横竖撇捺), radikal, hingga karya kaligrafi utuh. Bawa brush & tinta sendiri mulai pekan 3. Penilaian 70% praktik.",
  },
  {
    id: "mk-plb",
    kode: "PMDR236009",
    nama: "Pemahaman Lintas Budaya",
    dosen: ["Min Gong"],
    sks: 2,
    semester: 1,
    kelompok: "B – B",
    jadwal: [{ hari: "Jumat", jam: "07:00 – 08:40", ruang: "Ruang A20-613 Ged A20" }],
    pjIds: [],
    anggotaIds: [],
    warna: "#7c5cbf",
    kontrak:
      "Komunikasi lintas budaya Indonesia–Tiongkok, studi kasus, dan esai reflektif 1500 kata. Diskusi kelompok tiap pekan.",
  },
  {
    id: "mk-cc1",
    kode: "PMDR236001",
    nama: "Chinese Comprehensive 1",
    dosen: ["Yajun Lin", "Amira Eza Febrian Putri"],
    sks: 8,
    semester: 1,
    kelompok: "B – B",
    jadwal: [
      { hari: "Selasa", jam: "10:30 – 14:50", ruang: "Ruang A1-103 Ged A1" },
      { hari: "Kamis", jam: "13:10 – 16:35", ruang: "Ruang A20-514 Ged A20" },
    ],
    pjIds: [],
    anggotaIds: [],
    warna: "#e9a13b",
    kontrak:
      "Matkul inti 8 SKS: kosakata, tata bahasa, membaca, dan percakapan dasar. Kuis tiap 2 pekan, UTS lisan + tulis, UAS komprehensif. Target HSK 2.",
  },
];

/** Data asli Offering B(EST) PBM: [NIM, NAMA]. Kata sandi = NIM. */
const DATA_KELAS: [string, string][] = [
  ["260242648513", "ADINDA FAIZATUL AISYAH"],
  ["260242649243", "AFIFA SHEILA DEWI"],
  ["260242647182", "AMALIA FAUZA BIL JANNAH"],
  ["260242648537", "ANANDA PUTRI ARDITA"],
  ["260242655645", "DIYA AYU ECLYN MUSTIKA WATI"],
  ["260242648490", "ELSA DEALOVA NOVIANDARA"],
  ["260242652576", "EUNIKE LOUISA WIRANTI RAHARJO"],
  ["260242657610", "GALUH RIHHADATUL AISYAH"],
  ["260242656937", "GRACILLIA DIERA RAMADHINI"],
  ["260242653039", "JEREMY BRIAN CHRISTIAN"],
  ["260242648298", "MA'IDATUL FARIDA"],
  ["260242657041", "MAYVITA OLIVIA DWI ARYANI"],
  ["260242656785", "META LINNA PISQI SIAGIAN"],
  ["260242651282", "METANOIA XHEZYA GUNAWAN"],
  ["260242652932", "MEYFLOURA PUJA SYAHBELLA"],
  ["260242649788", "MUHAMMAD ARIEL FATHONI"],
  ["260242649033", "MUHAMMAD RADITYA FATHURROHMAN"],
  ["260242648613", "NASYIFA QURROTA A'YUN AZAHRA"],
  ["260242658325", "NATASHA GRACIELLA PUTRI EFENDI"],
  ["260242648546", "PUTRI FATIMATUS ZAHRO"],
  ["260242649014", "PUTRY NAWA LOKA EKA SAPTA"],
  ["260242658290", "RACHEL AUSTIN HAKIM"],
  ["260242652775", "RADEN AYU NIMAS SYAMSIATUL QOLBIYAH"],
  ["260242649316", "RANGGA DWITYO SURYA PRANATA"],
  ["260242657427", "RIZZA YUSTINNA SETYANINGRUM"],
  ["260242648171", "ROBI'ATUL MAULIDA"],
  ["260242650182", "ROCHAIFI DINA ABDILLAH"],
  ["260242648580", "SAYNA SIFA"],
  ["260242654999", "SHAFFA AURARIA BIDADARI KAMILA"],
  ["260242648965", "SHENNA ADITYAS"],
  ["260242652538", "SITI SAHILLAH RAKHMA UKHTA ZAKIYAH"],
  ["260242652077", "SYAVIRA ROUDHOTUL JANNAH"],
  ["260242652303", "ZAFAR SODIK"],
];

export function seedUsers(): User[] {
  return DATA_KELAS.map(([nim, nama], i) => ({
    id: nim === ADMIN_NIM ? "u-admin" : `u-${i + 1}`,
    nama: namaRapi(nama),
    nim,
    email: nim === ADMIN_NIM ? ADMIN_EMAIL : `${nim}@siswa.bedebest.id`,
    password: nim,
    role: nim === ADMIN_NIM ? ("admin" as const) : ("member" as const),
  }));
}

export function seedTugas(): Tugas[] {
  // Sengaja kosong: tugas diisi dari aktivitas kelas nyata (bukan contoh).
  // Contoh arsip lama dihapus saat go-live.
  return [];
}

export function seedCatatan(): Catatan[] {
  return [];
}

export function seedAktivitas(): Aktivitas[] {
  // Sengaja kosong: riwayat terisi dari aktivitas kelas nyata.
  return [];
}

/** Apakah subtask ini dicentang oleh user ini? (progres per-akun) */
export function subtaskSelesai(
  s: { done?: boolean; doneOleh?: string[] },
  userId: string | undefined
) {
  if (!userId) return false;
  if (s.doneOleh) return s.doneOleh.includes(userId);
  return !!s.done;
}

/** Matkul ini terlihat oleh user ini? Admin & PJ selalu bisa melihat. */
export function matkulTerlihat(m: Matkul, u: User | null | undefined) {
  if (!u) return false;
  if (u.role === "admin") return true;
  if ((m.pjIds ?? []).includes(u.id)) return true;
  const a = m.anggotaIds ?? [];
  return a.length === 0 || a.includes(u.id);
}

/** Saring daftar tugas ke matkul yang terlihat oleh user ini. */
export function tugasTerlihat<T extends { matkulId: string }>(
  tugas: T[],
  matkul: Matkul[],
  u: User | null | undefined
) {
  const boleh = new Set(matkul.filter((m) => matkulTerlihat(m, u)).map((m) => m.id));
  return tugas.filter((t) => boleh.has(t.matkulId));
}

export const HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
