"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FolderOpen, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { matkulTerlihat } from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";

/** Daftar matkul otomatis dari matkul terdaftar — tanpa tambah manual. */
export default function MateriPage() {
  const { matkul, tautan, user } = useStore();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const kunci = q.trim().toLowerCase();
    return matkul
      .filter((m) => matkulTerlihat(m, user))
      .filter((m) =>
        !kunci
          ? true
          : `${m.nama} ${m.kode} ${m.dosen.join(" ")}`.toLowerCase().includes(kunci)
      );
  }, [matkul, q, user]);

  const hitung = (id: string) => tautan.filter((t) => t.matkulId === id && t.kategori === "materi").length;

  return (
    <Shell>
      <SectionTitle
        no={<FolderOpen size={22} />}
        title="Materi"
        desc="File tetap di Drive, app cuma preview. Pilih matkul → 2 tombol: Buka Drive + Preview di App."
      />
      <label className="field mb-4 flex items-center gap-2 px-4 py-3">
        <Search size={18} className="shrink-0 text-(--color-faint)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari matkul…"
          className="w-full bg-transparent text-[15px] font-medium outline-none"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <article key={m.id} className="paper-card group flex flex-col overflow-hidden">
            <div className="relative px-5 pb-4 pt-5" style={{ background: `${m.warna}22` }}>
              <span className="tape absolute -top-0 left-1/2 h-5 w-20 -translate-x-1/2 px-2" style={{ background: `${m.warna}55` }} />
              <span className="rounded-lg px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white" style={{ background: m.warna }}>
                {m.kode}
              </span>
              <h3 className="font-display mt-2 text-[22px] font-bold leading-tight">{m.nama}</h3>
              <p className="mt-0.5 text-[13px] font-bold uppercase tracking-wide text-(--color-soft)">
                {m.dosen.join(" · ")}
              </p>
            </div>
            <div className="flex flex-1 items-center gap-2 px-5 pb-4 pt-3">
              <span className="text-[13px] font-bold text-(--color-soft)">
                {hitung(m.id)} folder materi
              </span>
              <Link
                href={`/materi/${m.id}`}
                className="btn-hard ml-auto flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-extrabold text-white"
                style={{ background: m.warna }}
              >
                Buka materi <ArrowRight size={15} strokeWidth={3} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!list.length && (
        <p className="paper-card mt-2 p-6 text-center text-[15px] text-(--color-soft)">
          Tidak ketemu. Coba kata kunci lain.
        </p>
      )}
    </Shell>
  );
}
