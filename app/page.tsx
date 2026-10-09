"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowRight, CalendarDays } from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat } from "@/lib/data";
import { Shell } from "@/components/shell";
import { AiCard } from "@/components/ai-card";
import { TugasRow } from "@/components/tugas-row";
import { SectionTitle, sisaHari } from "@/components/bits";

export default function Dashboard() {
  const { user, tugas, matkul, catatan } = useStore();
  // hanya matkul yang diambil user ini (UNIV bisa beda peserta)
  const tugasSaya = tugasTerlihat(tugas, matkul, user).filter((t) => !t.arsip);
  const catatanSaya = catatan.filter((c) =>
    matkul.some((m) => m.id === c.matkulId && matkulTerlihat(m, user))
  );
  const prSaya = tugasSaya.filter((t) => !sudahSelesai(t, user?.id));
  const selesaiSaya = tugasSaya.filter((t) => sudahSelesai(t, user?.id));
  const resmi = prSaya.filter((t) => t.status === "resmi").sort((a, b) => sisaHari(a.deadline) - sisaHari(b.deadline));
  const usulan = prSaya.filter((t) => t.status === "usulan");
  const mendesak = resmi.filter((t) => sisaHari(t.deadline) <= 3);
  const selesai = selesaiSaya.length;
  const hariIni = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });
  const jam = new Date().getHours();
  const sapaan = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <Shell>
      <header className="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="sticker inline-block max-w-full truncate bg-(--color-sky-soft) px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-(--color-sky) sm:text-[12px]">
            {hariIni}
          </span>
          <h1 className="font-display mt-2 text-[28px] font-bold leading-tight sm:text-[34px] md:text-[40px]">
            {sapaan}, {user?.nama.split(" ")[0]}!
          </h1>
          <p className="text-[15px] font-medium text-(--color-soft)">
            Ini ringkasan papan Offering B(EST) PBM hari ini.
          </p>
        </div>
        <Link
          href="/kalender"
          className="paper-card flex items-center gap-2 !rounded-full px-5 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:text-(--color-ink)"
        >
          <CalendarDays size={17} />
          Kalender
        </Link>
      </header>

      {/* Strip angka */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
        {[
          { n: String(resmi.length), l: "tugas resmi aktif", bg: "bg-(--color-sky-soft)", tc: "text-(--color-sky)" },
          { n: String(mendesak.length), l: "deadline ≤ 3 hari", bg: "bg-(--color-apel-soft)", tc: "text-(--color-apel)" },
          { n: String(usulan.length), l: "usulan menunggu PJ", bg: "bg-(--color-lemon-soft)", tc: "text-(--color-lemon)" },
          { n: String(selesai), l: "tugas selesai olehmu", bg: "bg-(--color-daun-soft)", tc: "text-(--color-daun)" },
        ].map((s) => (
          <div key={s.l} className="paper-card min-w-0 p-3.5 sm:p-4">
            <p className={`font-display tnum text-[32px] font-bold leading-none sm:text-[38px] ${s.tc}`}>{s.n}</p>
            <p className="mt-1.5 min-h-[32px] text-[12px] font-bold leading-snug text-(--color-soft) sm:text-[13px]">{s.l}</p>
            <div className={`mt-2 h-2 overflow-hidden rounded-full ${s.bg}`}>
              <div className={`h-full w-2/3 rounded-full ${s.tc.replace("text-", "bg-")}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AiCard />
          <div className="mt-6">
            <SectionTitle no="★" title="Deadline terdekat" desc="Urut otomatis dari yang paling mepet." />
            <div className="flex flex-col gap-3">
              {resmi.slice(0, 5).map((t) => (
                <TugasRow key={t.id} t={t} />
              ))}
              {!resmi.length && (
                <p className="paper-card p-5 text-[15px] text-(--color-soft)">
                  Belum ada tugas resmi. Tambahkan catatan di halaman matkul, biar PJ menyimpulkan.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <SectionTitle no="✉" title="Kabar kelas" desc="Info mentah dari teman sekelas." />
          <div className="flex flex-col gap-3">
            {catatanSaya.slice(0, 5).map((c) => {
              const m = matkul.find((x) => x.id === c.matkulId);
              return (
                <Link key={c.id} href={m ? `/matkul/${m.id}` : "/matkul"} className="paper-card group p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                    {m?.nama ?? "—"} · {c.oleh}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed">{c.isi}</p>
                  <span className="mt-2 flex items-center gap-1 text-[13px] font-extrabold text-(--color-apel)">
                    Buka di matkul <ArrowRight size={14} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
            {!catatanSaya.length && (
              <p className="paper-card p-5 text-[15px] text-(--color-soft)">Belum ada catatan.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
