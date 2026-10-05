"use client";

import { useState } from "react";
import { ArchiveRestore, LibraryBig } from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat } from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle, PertemuanCap } from "@/components/bits";
import { fmtPendek } from "@/components/bits";

export default function ArsipPage() {
  const { user, tugas, matkul, users, bisaSimpulkan, arsipkan } = useStore();
  const [filterMk, setFilterMk] = useState("semua");

  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const arsip = tugasTerlihat(tugas, matkul, user)
    .filter((t) => t.arsip)
    .filter((t) => filterMk === "semua" || t.matkulId === filterMk)
    .sort((a, b) => (b.pertemuan ?? -1) - (a.pertemuan ?? -1));

  // kelompokkan per pertemuan
  const grup = new Map<number | "x", typeof arsip>();
  for (const t of arsip) {
    const k = t.pertemuan ?? "x";
    if (!grup.has(k)) grup.set(k, []);
    grup.get(k)!.push(t);
  }
  const urutan = [...grup.keys()].sort((a, b) =>
    a === "x" ? 1 : b === "x" ? -1 : (b as number) - (a as number)
  );

  return (
    <Shell>
      <SectionTitle
        no={<LibraryBig size={22} />}
        title="Bank Arsip"
        desc="Kenangan tugas pertemuan-pertemuan lalu. Tidak mengganggu papan aktif, tidak mengirim notifikasi."
      />
      <div className="mb-4 flex gap-2">
        <select
          value={filterMk}
          onChange={(e) => setFilterMk(e.target.value)}
          className="field cursor-pointer px-4 py-2.5 text-[15px] font-bold"
        >
          <option value="semua">Semua matkul</option>
          {matkulSaya.map((m) => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
      </div>

      {urutan.map((k) => (
        <section key={String(k)} className="mb-6">
          <h3 className="font-display mb-2.5 flex items-center gap-2 text-[22px] font-bold">
            {k === "x" ? "Tanpa label pertemuan" : `Pertemuan ${k}`}
            <span className="tnum text-[14px] font-bold text-(--color-faint)">
              ({grup.get(k)!.length})
            </span>
          </h3>
          <div className="flex flex-col gap-2.5">
            {grup.get(k)!.map((t) => {
              const m = matkul.find((x) => x.id === t.matkulId);
              const jml = (t.selesaiOleh ?? []).length;
              const saya = sudahSelesai(t, user?.id);
              const boleh = bisaSimpulkan(t.matkulId);
              return (
                <article key={t.id} className="paper-card flex items-start gap-3 p-4 opacity-90">
                  <span
                    className="mt-1 h-8 w-2 shrink-0 rounded-full"
                    style={{ background: m?.warna ?? "#ccc" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {m && (
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                          {m.nama}
                        </span>
                      )}
                      <PertemuanCap n={t.pertemuan} />
                      {saya && (
                        <span className="sticker bg-(--color-daun-soft) px-2 py-0.5 text-[10px] font-extrabold text-(--color-daun)">
                          Kamu selesai
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[16px] font-bold leading-snug">{t.judul}</p>
                    <p className="mt-0.5 text-[13px] font-semibold text-(--color-soft)">
                      dikumpulkan {fmtPendek(t.deadline)} · {jml} dari {users.length} selesai
                    </p>
                  </div>
                  {boleh && (
                    <button
                      onClick={() => arsipkan(t.id, false)}
                      title="Keluarkan dari arsip"
                      className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-(--color-line) px-3 py-1.5 text-[12px] font-extrabold hover:bg-(--color-cream)"
                    >
                      <ArchiveRestore size={14} /> Aktifkan
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
      {!arsip.length && (
        <p className="paper-card p-6 text-center text-[15px] text-(--color-soft)">
          Arsip masih kosong. Tugas yang sudah lewat bisa diarsipkan dari halaman
          matkul (tombol arsip, khusus admin/PJ).
        </p>
      )}
    </Shell>
  );
}
