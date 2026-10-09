"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_EMAIL,
  seedAktivitas,
  seedCatatan,
  seedMatkul,
  seedTugas,
  seedUsers,
  urlAman,
  type Aktivitas,
  type Catatan,
  type KategoriTautan,
  type Matkul,
  type Prioritas,
  type StatusTugas,
  type Tautan,
  type TipeAktivitas,
  type Tugas,
  type User,
} from "./data";

interface Store {
  user: User | null;
  users: User[];
  matkul: Matkul[];
  tugas: Tugas[];
  catatan: Catatan[];
  tautan: Tautan[];
  aktivitas: Aktivitas[];
  login: (nama: string, nim: string) => string | null;
  logout: () => void;
  /** Ganti kata sandi sendiri. null = berhasil. */
  gantiPassword: (lama: string, baru: string) => string | null;
  addUser: (nama: string, nim: string) => string | null;
  removeUser: (id: string) => void;
  resetPassword: (id: string) => void;
  addMatkul: (m: Omit<Matkul, "id" | "pjIds" | "anggotaIds">) => void;
  updateMatkul: (id: string, m: Partial<Matkul>) => void;
  removeMatkul: (id: string) => void;
  /** Angkat/turunkan PJ matkul. Role user otomatis pj ↔ member (admin tak tersentuh). */
  tambahPj: (matkulId: string, userId: string) => void;
  hapusPj: (matkulId: string, userId: string) => void;
  /** Atur peserta matkul ([] = seluruh kelas). PJ selalu ikut terlihat. */
  setPeserta: (matkulId: string, ids: string[]) => void;
  /** Boleh menyimpulkan tugas di matkul ini? (admin / PJ matkul tsb) */
  bisaSimpulkan: (matkulId: string) => boolean;
  addCatatan: (matkulId: string, isi: string) => void;
  /**
   * Lapor usulan cepat = catatan info ringan untuk matkul tsb.
   * BUKAN tugas resmi. PJ menyimpulkannya jadi tugas resmi di halaman RPS.
   */
  addUsulan: (matkulId: string, isi: string) => void;
  /** Hapus catatan/usulan (pembuatnya, admin, atau PJ matkul tsb). */
  hapusCatatan: (id: string) => void;
  /** Tambah tautan penting. null = berhasil, string = pesan error. */
  addTautan: (input: {
    matkulId: string;
    judul: string;
    url: string;
    kategori: KategoriTautan;
    deskripsi: string;
  }) => string | null;
  /** Hapus tautan (pembuatnya, admin, atau PJ matkul tsb). */
  hapusTautan: (id: string) => void;
  finalizeTugas: (input: {
    matkulId: string;
    judul: string;
    deskripsi: string;
    deadline: string;
    prioritas: Prioritas;
    pertemuan?: number;
    catatanIds: string[];
  }) => void;
  /** Pindahkan ke / keluarkan dari Bank Arsip (admin & PJ). */
  arsipkan: (id: string, nilai: boolean) => void;
  /** Hapus tugas/usulan (admin & PJ, atau pembuatnya). */
  hapusTugas: (id: string) => void;
  /** Ubah isi tugas resmi (admin & PJ): judul, rincian, tanggal, prioritas, pertemuan. */
  updateTugas: (
    id: string,
    patch: {
      judul?: string;
      deskripsi?: string;
      deadline?: string;
      prioritas?: Prioritas;
      pertemuan?: number;
    }
  ) => void;
  updateTugasStatus: (id: string, status: StatusTugas) => void;
  /** Tandai / batalkan selesai — hanya untuk akun yang sedang login. */
  toggleSelesai: (id: string) => void;
  toggleSubtask: (tugasId: string, idx: number) => void;
  matkulById: (id: string) => Matkul | undefined;
}

const Ctx = createContext<Store | null>(null);
const LS_KEY = "tongban-store-v8";

/** Apakah user ini sudah menandai tugas selesai? */
export function sudahSelesai(t: { selesaiOleh?: string[] }, userId: string | undefined) {
  if (!userId) return false;
  return (t.selesaiOleh ?? []).includes(userId);
}

/** Penegakan hak akses di level store (selain disembunyikan di UI):
    tulis/finalisasi/ubah/hapus/arsip tugas hanya admin & PJ matkul tsb. */
export function bolehKelola(
  user: User | null,
  matkul: Matkul[],
  matkulId: string
) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (matkul.find((x) => x.id === matkulId)?.pjIds ?? []).includes(user.id);
}

/** Samakan semua deadline ke akhir hari (00:00 tidak dipakai — hanya tanggal).
 * Pakai komponen tanggal lokal agar tidak geser hari saat konversi UTC:
 * input "YYYY-MM-DD" (atau ISO) → "YYYY-MM-DDT23:59:00" lokal → ISO. */
export function akhirHari(input: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
  if (m) {
    const lokal = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 0, 0);
    if (!Number.isNaN(lokal.getTime())) return lokal.toISOString();
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

function load<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [matkul, setMatkul] = useState<Matkul[]>(seedMatkul);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [catatan, setCatatan] = useState<Catatan[]>([]);
  const [tautan, setTautan] = useState<Tautan[]>([]);
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hidrasi simpanan lokal sekali saat mount (pola standar, bukan cascade).
    const saved = load<Pick<Store, "users" | "matkul" | "tugas" | "catatan" | "tautan" | "aktivitas"> & { user: User | null }>(
      LS_KEY,
      () => ({ user: null, users: seedUsers(), matkul: seedMatkul, tugas: seedTugas(), catatan: seedCatatan(), tautan: [], aktivitas: seedAktivitas() })
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(saved.user);
    setUsers(saved.users.length ? saved.users : seedUsers());
    setMatkul(saved.matkul.length ? saved.matkul : seedMatkul);
    // Migrasi: usulan model lama (tugas berstatus usulan) diubah jadi catatan info,
    // agar alur baru konsisten: usulan = info ringan, resmi = via simpulan RPS.
    const tugasLama = saved.tugas ?? [];
    const daftarUser = saved.users.length ? saved.users : seedUsers();
    const idDariNama = new Map(daftarUser.map((u) => [u.nama, u.id]));
    const migrasi: Catatan[] = tugasLama
      .filter((t) => t.status === "usulan")
      .map((t) => ({
        id: `c-mig-${t.id}`,
        matkulId: t.matkulId,
        isi: t.judul,
        oleh: t.dibuatOleh || "Anggota",
        olehId: t.dibuatOlehId ?? idDariNama.get(t.dibuatOleh),
        createdAt: new Date().toISOString(),
      }));
    const tugasBersih = tugasLama
      .filter((t) => t.status !== "usulan")
      .map((t) => ({
        ...t,
        // backfill kepemilikan untuk data lama (cocokkan nama → id)
        dibuatOlehId: t.dibuatOlehId ?? idDariNama.get(t.dibuatOleh),
        // normalisasi subtask lama {label, done} agar punya doneOleh bila memungkinkan
        subtask: (t.subtask ?? []).map((s) => ({ ...s })),
      }));
    const catatanLama = (saved.catatan ?? []).map((c) => ({
      ...c,
      olehId: c.olehId ?? idDariNama.get(c.oleh),
    }));
    const catatanBaru = [
      ...catatanLama,
      ...migrasi.filter((m) => !catatanLama.some((c) => c.id === m.id)),
    ];
    setTugas(tugasBersih.length || catatanBaru.length ? tugasBersih : seedTugas());
    setCatatan(catatanBaru.length || tugasBersih.length ? catatanBaru : seedCatatan());
    const tautanLama = (saved.tautan ?? []).map((t) => ({
      ...t,
      olehId: t.olehId ?? idDariNama.get(t.oleh),
    }));
    setTautan(tautanLama);
    setAktivitas(saved.aktivitas?.length ? saved.aktivitas : seedAktivitas());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ user, users, matkul, tugas, catatan, tautan, aktivitas }));
  }, [user, users, matkul, tugas, catatan, tautan, aktivitas, ready]);

  function catat(tipe: TipeAktivitas, teks: string, oleh: string) {
    setAktivitas((p) =>
      [{ id: `a-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, tipe, teks, oleh, waktu: new Date().toISOString() }, ...p].slice(0, 120)
    );
  }

  const value: Store = useMemo(
    () => ({
      user,
      users,
      matkul,
      tugas,
      catatan,
      tautan,
      aktivitas,
      login: (nama, nim) => {
        const kunci = nama.trim().toLowerCase();
        const found = users.find(
          (u) => u.nama.toLowerCase() === kunci && u.password === nim.trim()
        );
        if (!found)
          return "Nama atau NIM salah. Pilih namamu dari daftar, kata sandinya NIM kamu.";
        setUser(found);
        return null;
      },
      logout: () => setUser(null),
      gantiPassword: (lama, baru) => {
        if (!user) return "Kamu belum masuk.";
        if (user.password !== lama) return "Kata sandi lama salah.";
        if (baru.trim().length < 6) return "Kata sandi baru minimal 6 karakter.";
        if (baru.trim() === lama) return "Kata sandi baru sama dengan yang lama.";
        const pw = baru.trim();
        setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, password: pw } : u)));
        setUser({ ...user, password: pw });
        return null;
      },
      addUser: (nama, nim) => {
        const bersih = nim.trim();
        if (!/^\d{6,}$/.test(bersih)) return "NIM harus berupa angka.";
        if (users.some((u) => u.nim === bersih)) return "NIM sudah terdaftar.";
        const id = `u-${Date.now()}`;
        setUsers((p) => [
          ...p,
          {
            id,
            nama: nama.trim(),
            nim: bersih,
            email: `${bersih}@siswa.bedebest.id`,
            password: bersih,
            role: "member",
          },
        ]);
        if (user) catat("anggota", `menambahkan anggota baru “${nama.trim()}”`, user.nama);
        return null;
      },
      removeUser: (id) => {
        const target = users.find((u) => u.id === id);
        if (target?.email === ADMIN_EMAIL) return;
        setUsers((p) => p.filter((u) => u.id !== id));
        if (target && user) catat("anggota", `menghapus anggota “${target.nama}”`, user.nama);
      },
      resetPassword: (id) =>
        setUsers((p) => {
          const target = p.find((u) => u.id === id);
          if (!target) return p;
          return p.map((u) => (u.id === id ? { ...u, password: target.nim } : u));
        }),
      addMatkul: (m) => {
        setMatkul((p) => [...p, { ...m, pjIds: [], anggotaIds: [], id: `mk-${Date.now()}` }]);
        if (user) catat("matkul", `menambahkan matkul “${m.nama}”`, user.nama);
      },
      updateMatkul: (id, m) => {
        setMatkul((p) => p.map((x) => (x.id === id ? { ...x, ...m } : x)));
        const target = matkul.find((x) => x.id === id);
        if (target && user) catat("matkul", `mengubah info ${target.nama}`, user.nama);
      },
      tambahPj: (matkulId, userId) => {
        setMatkul((p) =>
          p.map((x) =>
            x.id === matkulId && !(x.pjIds ?? []).includes(userId)
              ? { ...x, pjIds: [...(x.pjIds ?? []), userId] }
              : x
          )
        );
        setUsers((p) =>
          p.map((u) => (u.id === userId && u.role === "member" ? { ...u, role: "pj" } : u))
        );
        if (user && user.id === userId && user.role === "member")
          setUser({ ...user, role: "pj" });
        const target = users.find((u) => u.id === userId);
        const mk = matkul.find((x) => x.id === matkulId);
        if (target && mk && user) catat("anggota", `mengangkat “${target.nama}” jadi PJ ${mk.nama}`, user.nama);
      },
      hapusPj: (matkulId, userId) => {
        const sisa = matkul.filter((x) => x.id !== matkulId).flatMap((x) => x.pjIds ?? []);
        setMatkul((p) =>
          p.map((x) =>
            x.id === matkulId ? { ...x, pjIds: (x.pjIds ?? []).filter((v) => v !== userId) } : x
          )
        );
        // turunkan ke member bila tak lagi PJ di matkul mana pun (admin aman)
        if (!sisa.includes(userId)) {
          setUsers((p) =>
            p.map((u) => (u.id === userId && u.role === "pj" ? { ...u, role: "member" } : u))
          );
          if (user && user.id === userId && user.role === "pj")
            setUser({ ...user, role: "member" });
        }
        const target = users.find((u) => u.id === userId);
        const mk = matkul.find((x) => x.id === matkulId);
        if (target && mk && user) catat("anggota", `melepas “${target.nama}” dari PJ ${mk.nama}`, user.nama);
      },
      setPeserta: (matkulId, ids) => {
        setMatkul((p) => p.map((x) => (x.id === matkulId ? { ...x, anggotaIds: ids } : x)));
        const mk = matkul.find((x) => x.id === matkulId);
        if (mk && user)
          catat(
            "matkul",
            ids.length === 0
              ? `membuka ${mk.nama} untuk seluruh kelas`
              : `mengatur peserta ${mk.nama} (${ids.length} orang)`,
            user.nama
          );
      },
      bisaSimpulkan: (matkulId) => {
        if (!user || !matkul) return false;
        if (user.role === "admin") return true;
        const mk = matkul.find((x) => x.id === matkulId);
        return !!mk && (mk.pjIds ?? []).includes(user.id);
      },
      removeMatkul: (id) => {
        const target = matkul.find((x) => x.id === id);
        setMatkul((p) => p.filter((x) => x.id !== id));
        setTugas((p) => p.filter((t) => t.matkulId !== id));
        setCatatan((p) => p.filter((c) => c.matkulId !== id));
        if (target && user) catat("matkul", `menghapus matkul “${target.nama}”`, user.nama);
      },
      addCatatan: (matkulId, isi) => {
        if (!user) return;
        const teks = isi.trim().slice(0, 2000);
        if (!teks) return;
        const namaMk = matkul.find((x) => x.id === matkulId)?.nama ?? "matkul";
        setCatatan((p) => [
          {
            id: `c-${Date.now()}`,
            matkulId,
            isi: teks,
            oleh: user.nama,
            olehId: user.id,
            createdAt: new Date().toISOString(),
          },
          ...p,
        ]);
        catat("catatan", `mencatat info di ${namaMk}`, user.nama);
      },
      finalizeTugas: (input) => {
        const saya = user;
        if (!saya || !bolehKelola(saya, matkul, input.matkulId)) return;
        const judul = input.judul.trim().slice(0, 200);
        const deskripsi = input.deskripsi.trim().slice(0, 5000) || "—";
        if (!judul || !input.deadline) return;
        const id = `t-${Date.now()}`;
        setTugas((p) => [
          {
            id,
            matkulId: input.matkulId,
            judul,
            deskripsi,
            deadline: akhirHari(input.deadline),
            prioritas: input.prioritas,
            pertemuan: input.pertemuan,
            status: "resmi",
            dibuatOleh: saya.nama,
            dibuatOlehId: saya.id,
            disimpulkanOleh: saya.nama,
            subtask: [],
          },
          ...p,
        ]);
        setCatatan((p) =>
          p.map((c) => (input.catatanIds.includes(c.id) ? { ...c, tugasId: id } : c))
        );
        catat("resmi", `menerbitkan tugas resmi “${input.judul}”`, saya.nama);
      },
      addUsulan: (matkulId, isi) => {
        if (!user) return;
        const teks = isi.trim().slice(0, 2000);
        if (!teks) return;
        const namaMk = matkul.find((x) => x.id === matkulId)?.nama ?? "matkul";
        setCatatan((p) => [
          {
            id: `c-${Date.now()}`,
            matkulId,
            isi: teks,
            oleh: user.nama,
            olehId: user.id,
            createdAt: new Date().toISOString(),
          },
          ...p,
        ]);
        catat("usulan", `melaporkan info di ${namaMk}`, user.nama);
      },
      hapusCatatan: (id) => {
        const target = catatan.find((c) => c.id === id);
        const saya = user;
        if (!target || !saya) return;
        // pembuat sendiri (cek ID, bukan nama) boleh; sisanya hanya admin/PJ matkul tsb
        const milikku = target.olehId ? target.olehId === saya.id : target.oleh === saya.nama;
        if (!milikku && !bolehKelola(saya, matkul, target.matkulId)) return;
        setCatatan((p) => p.filter((c) => c.id !== id));
      },
      addTautan: (input) => {
        if (!user) return "Kamu belum masuk.";
        const judul = input.judul.trim().slice(0, 120);
        if (!judul) return "Judul wajib diisi.";
        const bersih = urlAman(input.url);
        if (!bersih) return "Link tidak valid. Pakai http(s), mis. https://docs.google.com/…";
        setTautan((p) => [
          {
            id: `l-${Date.now()}`,
            matkulId: input.matkulId,
            judul,
            url: bersih,
            kategori: input.kategori,
            deskripsi: input.deskripsi.trim().slice(0, 500),
            oleh: user.nama,
            olehId: user.id,
            createdAt: new Date().toISOString(),
          },
          ...p,
        ]);
        const namaMk = input.matkulId
          ? (matkul.find((x) => x.id === input.matkulId)?.nama ?? "matkul")
          : "kelas";
        catat("tautan", `menambahkan tautan “${judul}” di ${namaMk}`, user.nama);
        return null;
      },
      hapusTautan: (id) => {
        const target = tautan.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya) return;
        const milikku = target.olehId ? target.olehId === saya.id : target.oleh === saya.nama;
        if (milikku) {
          setTautan((p) => p.filter((t) => t.id !== id));
          return;
        }
        if (saya.role === "admin") {
          setTautan((p) => p.filter((t) => t.id !== id));
          return;
        }
        if (target.matkulId && bolehKelola(saya, matkul, target.matkulId)) {
          setTautan((p) => p.filter((t) => t.id !== id));
        }
      },
      updateTugasStatus: (id, status) =>
        setTugas((p) => p.map((t) => (t.id === id ? { ...t, status } : t))),
      arsipkan: (id, nilai) => {
        const target = tugas.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya || !bolehKelola(saya, matkul, target.matkulId)) return;
        setTugas((p) => p.map((t) => (t.id === id ? { ...t, arsip: nilai } : t)));
        catat(
          "resmi",
          nilai
            ? `mengarsipkan “${target.judul}” ke Bank Arsip`
            : `mengeluarkan “${target.judul}” dari arsip`,
          saya.nama
        );
      },
      hapusTugas: (id) => {
        const target = tugas.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya) return;
        // usulan boleh dihapus pembuatnya sendiri (cek ID, bukan nama); sisanya hanya admin/PJ
        const milikku = target.dibuatOlehId
          ? target.dibuatOlehId === saya.id
          : target.dibuatOleh === saya.nama;
        if (target.status !== "usulan" || !milikku) {
          if (!bolehKelola(saya, matkul, target.matkulId)) return;
        }
        setTugas((p) => p.filter((t) => t.id !== id));
        setCatatan((p) => p.map((c) => (c.tugasId === id ? { ...c, tugasId: undefined } : c)));
        catat("usulan", `menghapus “${target.judul}”`, saya.nama);
      },
      updateTugas: (id, patch) => {
        const target = tugas.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya || !bolehKelola(saya, matkul, target.matkulId)) return;
        setTugas((p) =>
          p.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...(patch.judul !== undefined ? { judul: patch.judul.trim().slice(0, 200) } : {}),
                  ...(patch.deskripsi !== undefined ? { deskripsi: patch.deskripsi.trim().slice(0, 5000) || "—" } : {}),
                  ...(patch.deadline !== undefined ? { deadline: akhirHari(patch.deadline) } : {}),
                  ...(patch.prioritas !== undefined ? { prioritas: patch.prioritas } : {}),
                  ...(patch.pertemuan !== undefined ? { pertemuan: patch.pertemuan } : {}),
                }
              : t
          )
        );
        if (target) catat("resmi", `mengubah “${target.judul}”`, saya.nama);
      },
      toggleSelesai: (id) => {
        if (!user) return;
        const target = tugas.find((t) => t.id === id);
        const akanSelesai = target ? !(target.selesaiOleh ?? []).includes(user.id) : false;
        setTugas((p) =>
          p.map((t) => {
            if (t.id !== id) return t;
            const sudah = (t.selesaiOleh ?? []).includes(user.id);
            return {
              ...t,
              selesaiOleh: sudah
                ? (t.selesaiOleh ?? []).filter((x) => x !== user.id)
                : [...(t.selesaiOleh ?? []), user.id],
            };
          })
        );
        if (akanSelesai && target) catat("selesai", `menyelesaikan “${target.judul}”`, user.nama);
      },
      toggleSubtask: (tugasId, idx) => {
        if (!user) return;
        const saya = user.id;
        setTugas((p) =>
          p.map((t) =>
            t.id === tugasId
              ? {
                  ...t,
                  subtask: t.subtask.map((s, i) => {
                    if (i !== idx) return s;
                    const daftar = s.doneOleh ?? [];
                    const sudah = daftar.includes(saya);
                    return {
                      ...s,
                      doneOleh: sudah ? daftar.filter((x) => x !== saya) : [...daftar, saya],
                    };
                  }),
                }
              : t
          )
        );
      },
      matkulById: (id) => matkul.find((m) => m.id === id),
    }),
    [user, users, matkul, tugas, catatan, tautan, aktivitas]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore harus di dalam StoreProvider");
  return ctx;
}
