import { differenceInCalendarDays, format } from "date-fns";
import { id } from "date-fns/locale";
import type { Prioritas } from "@/lib/data";

/** Semua tanggal tampil tanpa jam, lengkap dengan nama hari. */
export function fmtTanggal(isoStr: string) {
  return format(new Date(isoStr), "EEEE, d MMM yyyy", { locale: id });
}

export function fmtPendek(isoStr: string) {
  return format(new Date(isoStr), "EEEE, d MMM", { locale: id });
}

export function sisaHari(isoStr: string) {
  return differenceInCalendarDays(new Date(isoStr), new Date());
}

export function labelSisa(isoStr: string) {
  const s = sisaHari(isoStr);
  if (s < 0) return `Terlambat ${Math.abs(s)} hari`;
  if (s === 0) return "Hari ini";
  if (s === 1) return "Besok";
  return `H-${s}`;
}

export function PrioritasCap({ p }: { p: Prioritas }) {
  const map: Record<Prioritas, string> = {
    mendesak: "bg-(--color-apel-soft) text-(--color-apel)",
    sedang: "bg-(--color-lemon-soft) text-(--color-lemon)",
    rendah: "bg-(--color-daun-soft) text-(--color-daun)",
  };
  const label: Record<Prioritas, string> = {
    mendesak: "Mendesak!",
    sedang: "Sedang",
    rendah: "Santai",
  };
  return (
    <span className={`sticker px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide ${map[p]}`}>
      {label[p]}
    </span>
  );
}

export function SksCap({ sks }: { sks: number }) {
  return (
    <span className="sticker bg-(--color-lemon-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-ink)">
      {sks} SKS
    </span>
  );
}

export function PertemuanCap({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="rounded-full bg-(--color-sky-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-sky)">
      Pertemuan {n}
    </span>
  );
}

export function SectionTitle({
  no,
  title,
  desc,
}: {
  no: React.ReactNode;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="font-display flex h-11 w-11 shrink-0 rotate-[-4deg] items-center justify-center rounded-2xl bg-(--color-ink) text-lg font-extrabold text-[#fff6e8] dark:text-[#181222]">
        {no}
      </span>
      <div>
        <h2 className="font-display text-[26px] font-bold leading-tight">{title}</h2>
        {desc && <p className="mt-0.5 text-[15px] text-(--color-soft)">{desc}</p>}
      </div>
    </div>
  );
}
