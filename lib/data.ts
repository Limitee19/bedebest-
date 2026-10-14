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
  /** Link folder Drive utama matkul (opsional). File tetap di Drive, app cuma embed. */
  driveUrl?: string;
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
  /** Pertemuan virtual 1-16 (khusus kategori materi). Undefined = tanpa label. */
  pertemuan?: number;
  /** URL gambar/cover opsional (link saja, tanpa upload). "" = pakai ikon. */
  gambarUrl?: string;
  oleh: string;
  olehId?: string;
  createdAt: string;
}

/** Semester aktif tunggal: 1 baris, diatur admin. Kalender hanya render di range ini. */
export interface SemesterAktif {
  id: string;
  label: string;
  /** yyyy-MM-dd */
  mulai: string;
  /** yyyy-MM-dd */
  selesai: string;
}

export function semesterDefault(): SemesterAktif {
  const now = new Date();
  const mulai = new Date(now.getFullYear(), now.getMonth(), 1);
  const selesai = new Date(now.getFullYear(), now.getMonth() + 4, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { id: "aktif", label: "Semester 1", mulai: fmt(mulai), selesai: fmt(selesai) };
}

/** "2026-03-02" dalam [mulai, selesai]? Banding string yyyy-MM-dd aman. */
export function dalamSemester(tgl: string, s: SemesterAktif | null | undefined) {
  if (!s) return true;
  return tgl >= s.mulai && tgl <= s.selesai;
}

export type TipeOverride = "libur" | "pengganti" | "online" | "pindah";

export interface JadwalOverride {
  id: string;
  matkulId: string;
  /** yyyy-MM-dd — tanggal berlaku (pengganti muncul di sini) */
  tanggal: string;
  /** Khusus pengganti: tanggal asal yang dipindah (opsional). Sesi normal di tanggal asal disembunyikan. */
  asal?: string;
  tipe: TipeOverride;
  jam: string;
  ruang: string;
  keterangan: string;
  oleh: string;
  olehId?: string;
  createdAt: string;
}

export const LABEL_OVERRIDE: Record<TipeOverride, string> = {
  libur: "Libur",
  pengganti: "Kelas pengganti",
  online: "Online",
  pindah: "Pindah ruang/jam",
};

/** Sesi efektif pada satu tanggal: jadwal mingguan + override.
 * libur sembunyikan sesi; pengganti dengan `asal` memindah sesi dari tanggal asal. */
export function sesiPadaTanggal(
  daftar: Matkul[],
  overrides: JadwalOverride[],
  tanggal: Date,
  namaHari: string
) {
  const kunci =
    `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, "0")}-${String(tanggal.getDate()).padStart(2, "0")}`;
  const ovHari = overrides.filter((o) => o.tanggal === kunci);
  const libur = new Map<string, JadwalOverride>();
  for (const o of ovHari) {
    if (o.tipe === "libur") libur.set(o.matkulId, o);
  }
  // Pengganti yang dipindah DARI tanggal ini ke tanggal lain → sesi normal disembunyikan.
  const pindahKeluar = overrides.filter((o) => o.tipe === "pengganti" && o.asal === kunci);
  const pindahKeluarIds = new Set(pindahKeluar.map((o) => o.matkulId));
  const target = namaHari.toLowerCase().trim();
  const biasa = daftar.flatMap((m) =>
    m.jadwal
      .filter(
        (j) =>
          j.hari.toLowerCase().trim() === target &&
          !libur.has(m.id) &&
          !pindahKeluarIds.has(m.id)
      )
      .map((j) => {
        const ganti = ovHari.find(
          (o) => o.matkulId === m.id && (o.tipe === "online" || o.tipe === "pindah")
        );
        return {
          m,
          j: ganti
            ? {
                hari: j.hari,
                jam: ganti.jam || j.jam,
                ruang: ganti.ruang || j.ruang,
              }
            : j,
          ov: ganti,
        };
      })
  );
  const tambahan = ovHari
    .filter((o) => o.tipe === "pengganti")
    .map((o) => ({
      m: daftar.find((x) => x.id === o.matkulId),
      j: { hari: namaHari, jam: o.jam || "Menyusul", ruang: o.ruang || "Menyusul" } as Jadwal,
      ov: o as JadwalOverride | undefined,
    }))
    .filter((x) => !!x.m && !libur.has(x.m!.id))
    .map((x) => ({ m: x.m!, j: x.j, ov: x.ov }));
  const dipindah = pindahKeluar
    .map((o) => ({ m: daftar.find((x) => x.id === o.matkulId), ov: o }))
    .filter((x): x is { m: Matkul; ov: JadwalOverride } => !!x.m);
  return { kunci, biasa, tambahan, libur, ovHari, dipindah };
}

/** Palet tema + picker bebas (dengan swatch cepat). */
export const PALET_WARNA = ["#3f8fd1", "#2fa08a", "#e8552f", "#e75d8f", "#7c5cbf", "#e9a13b"];

/** Teks putih atau tinta di atas hex — cegah kuning-terang tak terbaca. */
export function teksDiAtas(hex: string) {
  const h = hex.replace("#", "").trim();
  const penuh = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(penuh.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#fff";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#3b2e23" : "#fff";
}

export const DEFAULT_WARNA_KATEGORI: Record<KategoriTautan, string> = {
  kumpul: "#2f9459",
  materi: "#3f8fd1",
  data: "#7c5cbf",
  lainnya: "#6f5f4e",
};

export const LS_WARNA_KATEGORI = "tongban-warna-kategori";
export const LS_WARNA_KELAS = "tongban-warna-kelas";
export const WARNA_KELAS_DEFAULT = "#e8552f";

export function muatWarnaKategori(): Record<KategoriTautan, string> {
  if (typeof window === "undefined") return { ...DEFAULT_WARNA_KATEGORI };
  try {
    const raw = localStorage.getItem(LS_WARNA_KATEGORI);
    if (!raw) return { ...DEFAULT_WARNA_KATEGORI };
    const o = JSON.parse(raw) as Partial<Record<KategoriTautan, string>>;
    return { ...DEFAULT_WARNA_KATEGORI, ...o };
  } catch {
    return { ...DEFAULT_WARNA_KATEGORI };
  }
}

export function muatWarnaKelas(): string {
  if (typeof window === "undefined") return WARNA_KELAS_DEFAULT;
  try {
    return localStorage.getItem(LS_WARNA_KELAS) || WARNA_KELAS_DEFAULT;
  } catch {
    return WARNA_KELAS_DEFAULT;
  }
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

/** Hasil urai link Drive: file, folder, atau dokumen (Docs/Sheets/Slides). */
export type DriveInfo =
  | { jenis: "file"; id: string }
  | { jenis: "folder"; id: string }
  | { jenis: "dokumen"; id: string; app: "document" | "spreadsheets" | "presentation" }
  | { jenis: "bukan" };

/** Urai ID dari berbagai format link Drive/Docs agar bisa di-embed preview. */
export function driveInfoDari(url: string): DriveInfo {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return { jenis: "bukan" };
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;
  const idDariParam = u.searchParams.get("id") ?? "";
  const segar = (s: string) => /^[A-Za-z0-9_-]{10,}$/.test(s);
  if (host === "drive.google.com") {
    const mFile = /\/(?:file|open)\/d\/([A-Za-z0-9_-]{10,})/.exec(path);
    if (mFile) return { jenis: "file", id: mFile[1] };
    if (path.startsWith("/embeddedfolderview") && segar(idDariParam))
      return { jenis: "folder", id: idDariParam };
    if (path.startsWith("/drive/folders/")) {
      const id = path.split("/").filter(Boolean).pop() ?? "";
      if (segar(id)) return { jenis: "folder", id };
    }
    if (segar(idDariParam)) {
      if (path.startsWith("/open") || path.startsWith("/uc") || path.startsWith("/file"))
        return { jenis: "file", id: idDariParam };
      return { jenis: "folder", id: idDariParam };
    }
  }
  if (host === "docs.google.com" || host === "sheets.google.com" || host === "slides.google.com") {
    const app =
      path.startsWith("/spreadsheets") || host === "sheets.google.com"
        ? ("spreadsheets" as const)
        : path.startsWith("/presentation") || host === "slides.google.com"
          ? ("presentation" as const)
          : ("document" as const);
    const m = /\/(?:document|spreadsheets|presentation)\/d\/([A-Za-z0-9_-]{10,})/.exec(path);
    if (m) return { jenis: "dokumen", id: m[1], app };
  }
  return { jenis: "bukan" };
}

/** URL embed preview Drive. File tetap di Drive, app cuma menampilkannya. */
export function driveEmbedDari(info: DriveInfo): string | null {
  if (info.jenis === "file") return `https://drive.google.com/file/d/${info.id}/preview`;
  if (info.jenis === "folder") return `https://drive.google.com/embeddedfolderview?id=${info.id}#list`;
  if (info.jenis === "dokumen") {
    const seg =
      info.app === "spreadsheets"
        ? "spreadsheets"
        : info.app === "presentation"
          ? "presentation"
          : "document";
    return `https://docs.google.com/${seg}/d/${info.id}/preview`;
  }
  return null;
}

/** Apakah URL ini bisa di-preview di dalam app? */
export function bisaPreviewDrive(url: string) {
  return driveEmbedDari(driveInfoDari(url)) !== null;
}

/** "Pertemuan 2 - Pakaian" → 2. Untuk browser isi folder root otomatis. */
export function nomorPertemuan(nama: string): number | null {
  const m = /pertemuan\s*(\d{1,2})/i.exec(nama);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 16 ? n : null;
}

export type TipeAktivitas =
  | "catatan"
  | "usulan"
  | "resmi"
  | "selesai"
  | "anggota"
  | "matkul"
  | "tautan"
  | "jadwal"
  | "semester";

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
