"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ADMIN_EMAIL,
  seedAktivitas,
  seedCatatan,
  seedMatkul,
  seedTugas,
  seedUsers,
  type Aktivitas,
  type Catatan,
  type Matkul,
  type Prioritas,
  type StatusTugas,
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
  addUsulan: (input: {
    matkulId: string;
    judul: string;
    deadline: string;
    prioritas: Prioritas;
    pertemuan?: number;
  }) => void;
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
  /** Ubah usulan menjadi tugas resmi (admin & PJ). */
  jadikanResmi: (id: string) => void;
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

/** Samakan semua deadline ke akhir hari (00:00 tidak dipakai — hanya tanggal). */
export function akhirHari(input: string) {
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
  const [aktivitas, setAktivitas] = useState<Aktivitas[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = load<Pick<Store, "users" | "matkul" | "tugas" | "catatan" | "aktivitas"> & { user: User | null }>(
      LS_KEY,
      () => ({ user: null, users: seedUsers(), matkul: seedMatkul, tugas: seedTugas(), catatan: seedCatatan(), aktivitas: seedAktivitas() })
    );
    setUser(saved.user);
    setUsers(saved.users.length ? saved.users : seedUsers());
    setMatkul(saved.matkul.length ? saved.matkul : seedMatkul);
    setTugas(saved.tugas.length || saved.catatan.length ? saved.tugas : seedTugas());
    setCatatan(saved.catatan.length || saved.tugas.length ? saved.catatan : seedCatatan());
    setAktivitas(saved.aktivitas?.length ? saved.aktivitas : seedAktivitas());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ user, users, matkul, tugas, catatan, aktivitas }));
  }, [user, users, matkul, tugas, catatan, aktivitas, ready]);

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
        const namaMk = matkul.find((x) => x.id === matkulId)?.nama ?? "matkul";
        setCatatan((p) => [
          {
            id: `c-${Date.now()}`,
            matkulId,
            isi,
            oleh: user.nama,
            createdAt: new Date().toISOString(),
          },
          ...p,
        ]);
        catat("catatan", `mencatat info di ${namaMk}`, user.nama);
      },
      finalizeTugas: (input) => {
        const saya = user;
        if (!saya || !bolehKelola(saya, matkul, input.matkulId)) return;
        const id = `t-${Date.now()}`;
        setTugas((p) => [
          {
            id,
            matkulId: input.matkulId,
            judul: input.judul,
            deskripsi: input.deskripsi,
            deadline: akhirHari(input.deadline),
            prioritas: input.prioritas,
            pertemuan: input.pertemuan,
            status: "resmi",
            dibuatOleh: saya.nama,
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
      addUsulan: (input) => {
        if (!user) return;
        setTugas((p) => [
          {
            id: `t-${Date.now()}`,
            matkulId: input.matkulId,
            judul: input.judul,
            deskripsi: "Usulan dari papan tugas — menunggu disimpulkan PJ/admin.",
            deadline: akhirHari(input.deadline),
            prioritas: input.prioritas,
            pertemuan: input.pertemuan,
            status: "usulan",
            dibuatOleh: user.nama,
            subtask: [],
          },
          ...p,
        ]);
        catat("usulan", `mengusulkan “${input.judul}”`, user.nama);
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
      jadikanResmi: (id) => {
        const target = tugas.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya || !bolehKelola(saya, matkul, target.matkulId)) return;
        setTugas((p) =>
          p.map((t) =>
            t.id === id
              ? { ...t, status: "resmi" as const, disimpulkanOleh: saya.nama }
              : t
          )
        );
        catat("resmi", `menyetujui usulan “${target.judul}” jadi tugas resmi`, saya.nama);
      },
      hapusTugas: (id) => {
        const target = tugas.find((t) => t.id === id);
        const saya = user;
        if (!target || !saya) return;
        // usulan boleh dihapus pembuatnya sendiri; sisanya hanya admin/PJ
        if (target.status !== "usulan" || target.dibuatOleh !== saya.nama) {
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
                  ...(patch.judul !== undefined ? { judul: patch.judul } : {}),
                  ...(patch.deskripsi !== undefined ? { deskripsi: patch.deskripsi } : {}),
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
      toggleSubtask: (tugasId, idx) =>
        setTugas((p) =>
          p.map((t) =>
            t.id === tugasId
              ? {
                  ...t,
                  subtask: t.subtask.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)),
                }
              : t
          )
        ),
      matkulById: (id) => matkul.find((m) => m.id === id),
    }),
    [user, users, matkul, tugas, catatan, aktivitas]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore harus di dalam StoreProvider");
  return ctx;
}
