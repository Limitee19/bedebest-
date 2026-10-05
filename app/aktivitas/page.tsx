"use client";

import {
  BookPlus,
  CheckCircle2,
  History,
  Lightbulb,
  Megaphone,
  Stamp,
  UserPlus,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import type { TipeAktivitas } from "@/lib/data";

const IKON: Record<TipeAktivitas, { icon: typeof Megaphone; bg: string; fg: string }> = {
  catatan: { icon: Megaphone, bg: "bg-(--color-lemon-soft)", fg: "text-(--color-lemon)" },
  usulan: { icon: Lightbulb, bg: "bg-(--color-sky-soft)", fg: "text-(--color-sky)" },
  resmi: { icon: Stamp, bg: "bg-(--color-apel-soft)", fg: "text-(--color-apel)" },
  selesai: { icon: CheckCircle2, bg: "bg-(--color-daun-soft)", fg: "text-(--color-daun)" },
  anggota: { icon: UserPlus, bg: "bg-(--color-pink-soft)", fg: "text-(--color-pink)" },
  matkul: { icon: BookPlus, bg: "bg-(--color-cream)", fg: "text-(--color-soft)" },
};

export function waktuLalu(isoStr: string) {
  const beda = Date.now() - new Date(isoStr).getTime();
  const menit = Math.floor(beda / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(isoStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function AktivitasPage() {
  const { aktivitas } = useStore();

  return (
    <Shell>
      <SectionTitle
        no={<History size={22} />}
        title="Riwayat Kelas"
        desc={`${aktivitas.length} kejadian tercatat · otomatis terpotong, jadi tidak memberatkan penyimpanan.`}
      />
      <ol className="relative ml-2 flex flex-col gap-2.5 border-l-[3px] border-dashed border-(--color-line) pl-5">
        {aktivitas.map((a) => {
          const meta = IKON[a.tipe];
          return (
            <li key={a.id} className="paper-card relative !rounded-2xl p-3.5">
              <span className="absolute -left-[31px] top-3.5 h-3.5 w-3.5 rounded-full border-[3px] border-(--color-paper) bg-(--color-lemon)" />
              <div className="flex items-start gap-2.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${meta.bg}`}>
                  <meta.icon size={17} className={meta.fg} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] leading-snug">
                    <b>{a.oleh}</b> <span className="text-(--color-soft)">{a.teks}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-(--color-faint)">
                    {waktuLalu(a.waktu)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
        {!aktivitas.length && (
          <p className="paper-card p-5 text-[15px] text-(--color-soft)">
            Belum ada aktivitas. Mulai dengan mencatat info tugas!
          </p>
        )}
      </ol>
    </Shell>
  );
}
