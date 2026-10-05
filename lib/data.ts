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
  disimpulkanOleh?: string;
  subtask: { label: string; done: boolean }[];
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
  createdAt: string;
}

export type TipeAktivitas =
  | "catatan"
  | "usulan"
  | "resmi"
  | "selesai"
  | "anggota"
  | "matkul";

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
    email: nim === ADMIN_NIM ? ADMIN_EMAIL : `${nim}@siswa.tongban.id`,
    password: nim,
    role: nim === ADMIN_NIM ? ("admin" as const) : ("member" as const),
  }));
}

const iso = (daysFromNow: number, hour = 23, min = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export function seedTugas(): Tugas[] {
  return [
    {
      id: "t-1",
      matkulId: "mk-cc1",
      judul: "Kuis kosakata Unit 3–4 + latihan Hanzi",
      deskripsi:
        "Hasil simpulan PJ: kuis tulis 40 kosakata unit 3–4, plus latihan menulis Hanzi 20 karakter di buku latihan. Bawa kamus kecil.",
      deadline: iso(2),
      prioritas: "mendesak",
      status: "resmi",
      dibuatOleh: "Muhammad Ariel Fathoni",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      pertemuan: 6,
      subtask: [
        { label: "Hafal 40 kosakata unit 3–4", done: true },
        { label: "Latihan tulis 20 Hanzi", done: false },
        { label: "Kerjakan workbook hal. 45–47", done: false },
      ],
    },
    {
      id: "t-2",
      matkulId: "mk-ppd",
      judul: "Laporan observasi perkembangan anak",
      deskripsi:
        "Observasi 1 anak usia sekolah dasar, catat aspek kognitif & sosial-emosional. Minimal 1200 kata + lampiran foto kegiatan (izin ortu).",
      deadline: iso(5),
      prioritas: "sedang",
      status: "resmi",
      dibuatOleh: "Adinda Faizatul Aisyah",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      subtask: [
        { label: "Tentukan subjek observasi", done: true },
        { label: "Observasi 2x kunjungan", done: false },
        { label: "Tulis laporan 1200 kata", done: false },
      ],
    },
    {
      id: "t-3",
      matkulId: "mk-kaligrafi",
      judul: "Setor 8 goresan dasar di kertas xuan",
      deskripsi: "Praktik 横 竖 撇 捺 提 钩 折 点 masing-masing 1 baris. Foto dan kumpulkan via grup sebelum jam kelas.",
      deadline: iso(4),
      prioritas: "sedang",
      status: "resmi",
      dibuatOleh: "Sayna Sifa",
      disimpulkanOleh: "Sayna Sifa",
      subtask: [
        { label: "Latihan 8 goresan", done: false },
        { label: "Foto hasil di kertas xuan", done: false },
      ],
    },
    {
      id: "t-4",
      matkulId: "mk-plb",
      judul: "Esai reflektif lintas budaya 1500 kata",
      deskripsi: "Tema: perbedaan sopan santun makan Indonesia–Tiongkok. Struktur: pengalaman, analisis, refleksi. Deadline lunak pekan ini, final pekan depan.",
      deadline: iso(9),
      prioritas: "rendah",
      status: "resmi",
      dibuatOleh: "Rangga Dwityo Surya Pranata",
      subtask: [
        { label: "Riset 3 sumber", done: false },
        { label: "Draft esai", done: false },
      ],
    },
    {
      id: "t-5",
      matkulId: "mk-seni",
      judul: "Rangkuman video opera Peking (usulan)",
      deskripsi: "Usulan dari grup: kayanya disuruh rangkum video opera Peking 20 menit. Menunggu konfirmasi PJ.",
      deadline: iso(6),
      prioritas: "rendah",
      status: "usulan",
      dibuatOleh: "Jeremy Brian Christian",
      subtask: [],
    },
    {
      id: "t-6",
      matkulId: "mk-pai",
      judul: "Makalah kelompok: akhlak pendidik",
      deskripsi: "Kelompok 4–5 orang, 8–10 halaman. Presentasi pekan ke-12. Pembagian kelompok menyusul.",
      deadline: iso(12),
      prioritas: "sedang",
      status: "resmi",
      dibuatOleh: "Putri Fatimatus Zahro",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      subtask: [
        { label: "Bentuk kelompok", done: true },
        { label: "Bagi bab penulisan", done: false },
        { label: "Presentasi", done: false },
      ],
    },
    // ---- Bank Arsip: pertemuan 1–5 (sekarang minggu ke-6) ----
    {
      id: "t-a1",
      matkulId: "mk-cc1",
      judul: "Kuis kosakata Unit 1–2",
      deskripsi: "Kuis tulis 30 kosakata + dengar 10 kalimat. Nilai sudah keluar.",
      deadline: iso(-19),
      prioritas: "sedang",
      status: "resmi",
      dibuatOleh: "Muhammad Ariel Fathoni",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      subtask: [],
      pertemuan: 2,
      arsip: true,
      selesaiOleh: ["u-admin", "u-3", "u-9"],
    },
    {
      id: "t-a2",
      matkulId: "mk-kaligrafi",
      judul: "Latihan garis horizontal & vertikal",
      deskripsi: "Satu halaman penuh garis 横 dan 竖 di kertas latihan.",
      deadline: iso(-23),
      prioritas: "rendah",
      status: "resmi",
      dibuatOleh: "Sayna Sifa",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      subtask: [],
      pertemuan: 1,
      arsip: true,
      selesaiOleh: ["u-admin"],
    },
    {
      id: "t-a3",
      matkulId: "mk-plb",
      judul: "Diskusi kelompok: budaya makan",
      deskripsi: "Presentasi 10 menit per kelompok + lembar refleksi.",
      deadline: "2026-09-18T23:59:00.000Z",
      prioritas: "rendah",
      status: "resmi",
      dibuatOleh: "Rangga Dwityo Surya Pranata",
      subtask: [],
      pertemuan: 3,
      arsip: true,
      selesaiOleh: [],
    },
    {
      id: "t-a4",
      matkulId: "mk-ppd",
      judul: "Rangkuman teori perkembangan kognitif",
      deskripsi: "Rangkum 2 halaman teori Piaget + contoh di kelas.",
      deadline: "2026-09-21T23:59:00.000Z",
      prioritas: "sedang",
      status: "resmi",
      dibuatOleh: "Adinda Faizatul Aisyah",
      disimpulkanOleh: "Muhammad Ariel Fathoni",
      subtask: [],
      pertemuan: 4,
      arsip: true,
      selesaiOleh: ["u-1", "u-20"],
    },
    {
      id: "t-a5",
      matkulId: "mk-seni",
      judul: "Rangkuman video alat musik tradisional",
      deskripsi: "Tonton 15 menit, tulis 5 alat musik + cara memainkannya.",
      deadline: "2026-09-29T23:59:00.000Z",
      prioritas: "rendah",
      status: "resmi",
      dibuatOleh: "Jeremy Brian Christian",
      subtask: [],
      pertemuan: 5,
      arsip: true,
      selesaiOleh: [],
    },
  ];
}

export function seedCatatan(): Catatan[] {
  return [
    {
      id: "c-1",
      matkulId: "mk-cc1",
      tugasId: "t-1",
      isi: "Lao Shi bilang kuisnya maju ke Kamis, yang diujikan unit 3–4 aja, unit 5 minggu depan.",
      oleh: "Zafar Sodik",
      createdAt: iso(-1, 20, 15),
    },
    {
      id: "c-2",
      matkulId: "mk-cc1",
      tugasId: "t-1",
      isi: "Tambahan: disuruh bawa buku latihan Hanzi yang kotak-kotak, dikumpulkan sekalian.",
      oleh: "Sayna Sifa",
      createdAt: iso(-1, 21, 2),
    },
    {
      id: "c-3",
      matkulId: "mk-ppd",
      tugasId: "t-2",
      isi: "Bu Risa bilang boleh observasi keponakan sendiri asal beda KK, tanya izin dulu.",
      oleh: "Adinda Faizatul Aisyah",
      createdAt: iso(-2, 14, 40),
    },
    {
      id: "c-4",
      matkulId: "mk-seni",
      isi: "Katanya minggu depan disuruh nonton video opera Peking terus dirangkum, tapi belum jelas berapa menit. Ada yang denger juga?",
      oleh: "Jeremy Brian Christian",
      createdAt: iso(0, 10, 5),
    },
  ];
}

export function seedAktivitas(): Aktivitas[] {
  return [
    {
      id: "a-1",
      tipe: "resmi",
      teks: "menerbitkan tugas resmi “Kuis kosakata Unit 3–4”",
      oleh: "Muhammad Ariel Fathoni",
      waktu: iso(-1, 21, 30),
    },
    {
      id: "a-2",
      tipe: "catatan",
      teks: "mencatat info di Kaligrafi Tiongkok",
      oleh: "Sayna Sifa",
      waktu: iso(-1, 21, 2),
    },
    {
      id: "a-3",
      tipe: "usulan",
      teks: "mengusulkan “Rangkuman video opera Peking”",
      oleh: "Jeremy Brian Christian",
      waktu: iso(0, 10, 5),
    },
  ];
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
