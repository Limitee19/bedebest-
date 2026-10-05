import { differenceInCalendarDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { matkulTerlihat, type Jadwal, type Matkul, type Tugas, type User } from "./data";

export interface Pengingat {
  id: string;
  judul: string;
  matkulNama: string;
  sisa: number;
  teks: string;
}

/**
 * Pengingat deadline H-3 sampai H-0: hanya tugas resmi, hanya matkul yang
 * diambil user ini, dan hanya yang BELUM ditandai selesai olehnya.
 */
export function pengingatDeadline(
  tugas: Tugas[],
  matkul: Matkul[],
  user: User | null | undefined
): Pengingat[] {
  if (!user) return [];
  const boleh = new Set(
    matkul.filter((m) => matkulTerlihat(m, user)).map((m) => m.id)
  );
  const now = new Date();
  return tugas
    .filter(
      (t) =>
        t.status === "resmi" &&
        boleh.has(t.matkulId) &&
        !(t.selesaiOleh ?? []).includes(user.id)
    )
    .map((t) => ({ t, sisa: differenceInCalendarDays(new Date(t.deadline), now) }))
    .filter((x) => x.sisa >= 0 && x.sisa <= 3)
    .sort((a, b) => a.sisa - b.sisa)
    .map(({ t, sisa }) => {
      const nama = matkul.find((m) => m.id === t.matkulId)?.nama ?? "Tanpa matkul";
      const kapan = sisa === 0 ? "hari ini" : sisa === 1 ? "besok" : `${sisa} hari lagi`;
      return {
        id: t.id,
        judul: t.judul,
        matkulNama: nama,
        sisa,
        teks: `${t.judul} — ${nama}, dikumpulkan ${kapan}.`,
      };
    });
}

export function namaHariIni() {
  return format(new Date(), "EEEE", { locale: localeId });
}

export interface SesiHariIni {
  m: Matkul;
  sesi: Jadwal;
}

/** Sesi kuliah hari ini, hanya matkul yang diambil user ini. */
export function jadwalHariIni(matkul: Matkul[], user?: User | null): SesiHariIni[] {
  const daftar = user ? matkul.filter((m) => matkulTerlihat(m, user)) : matkul;
  const hari = namaHariIni().toLowerCase().slice(0, 4);
  return daftar.flatMap((m) =>
    m.jadwal.filter((sesi) => sesi.hari.toLowerCase().includes(hari)).map((sesi) => ({ m, sesi }))
  );
}

export function kunciHariIni() {
  return format(new Date(), "yyyy-MM-dd");
}
