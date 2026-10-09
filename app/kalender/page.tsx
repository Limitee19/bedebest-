"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat } from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function KalenderPage() {
  const { user, matkul, tugas } = useStore();
  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const tugasSaya = tugasTerlihat(tugas, matkul, user);
  const senin = startOfWeek(new Date(), { weekStartsOn: 1 });
  const pekan = HARI.map((h, i) => ({ nama: h, tanggal: addDays(senin, i) }));

  return (
    <Shell>
      <SectionTitle
        no="⛅"
        title="Kalender Kelas"
        desc={`Pekan ${format(senin, "d MMM", { locale: id })} – ${format(addDays(senin, 6), "d MMM yyyy", { locale: id })} · jadwal kuliah + tanggal kumpul tugas.`}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pekan.map((h) => {
          const sesi = matkulSaya.flatMap((m) =>
            m.jadwal
              .filter((j) => j.hari.toLowerCase().trim() === h.nama.toLowerCase())
              .map((j) => ({ m, j }))
          );
          const dl = tugasSaya.filter(
            (t) =>
              t.status === "resmi" &&
              format(new Date(t.deadline), "yyyy-MM-dd") === format(h.tanggal, "yyyy-MM-dd")
          );
          const isHariIni = format(new Date(), "yyyy-MM-dd") === format(h.tanggal, "yyyy-MM-dd");
          return (
            <article key={h.nama} className={`paper-card p-4 ${isHariIni ? "border-2 border-(--color-ink)" : ""}`}>
              <header className="flex items-baseline justify-between border-b-2 border-dashed border-(--color-line) pb-2">
                <h3 className="font-display text-[20px] font-bold">{h.nama}</h3>
                <span className="tnum text-[13px] font-bold text-(--color-faint)">
                  {format(h.tanggal, "d MMM", { locale: id })}
                  {isHariIni && <b className="sticker ml-1.5 bg-(--color-apel-soft) px-2 py-0.5 text-[10px] text-(--color-apel)">HARI INI</b>}
                </span>
              </header>
              <div className="mt-2.5 flex flex-col gap-2">
                {sesi.map(({ m, j }, i) => (
                  <Link key={`${m.id}-${i}`} href={`/matkul/${m.id}`} className="flex items-center gap-2.5 rounded-2xl bg-(--color-cream) px-3 py-2 text-[14px] hover:underline">
                    <span className="h-7 w-2 shrink-0 rounded-full" style={{ background: m.warna }} />
                    <span className="font-extrabold">{m.nama}</span>
                    <span className="ml-auto text-right text-[12px] font-bold leading-tight text-(--color-soft)">{j.jam}</span>
                  </Link>
                ))}
                {dl.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-2xl bg-(--color-apel-soft) px-3 py-2 text-[14px]">
                    <span className="rounded-full bg-(--color-apel) px-2 py-0.5 text-[10px] font-extrabold text-white">KUMPUL</span>
                    <span className="font-extrabold">{t.judul}</span>
                  </div>
                ))}
                {!sesi.length && !dl.length && (
                  <p className="py-3 text-center text-[14px] font-medium text-(--color-faint)">Hari bebas, waktunya rebahan~</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
