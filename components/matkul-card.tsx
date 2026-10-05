import Link from "next/link";
import { useState } from "react";
import { ArrowRight, PencilLine, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Matkul } from "@/lib/data";
import { SksCap } from "./bits";
import { ModalUbahMatkul } from "./matkul-form";

export function MatkulCard({ m, onEdit, onDelete }: { m: Matkul; onEdit?: () => void; onDelete?: () => void }) {
  const { tugas, users, bisaSimpulkan } = useStore();
  const [bukaUbah, setBukaUbah] = useState(false);
  const bolehUbah = bisaSimpulkan(m.id);
  const aktif = tugas.filter((t) => t.matkulId === m.id && t.status === "resmi" && !t.arsip).length;
  const namaPj = (m.pjIds ?? [])
    .map((id) => users.find((u) => u.id === id)?.nama)
    .filter(Boolean);
  const terbatas = (m.anggotaIds ?? []).length > 0;
  return (
    <article className="paper-card group flex flex-col overflow-hidden">
      {/* Kepala pastel */}
      <div className="relative px-5 pb-4 pt-5" style={{ background: `${m.warna}22` }}>
        <span
          className="tape absolute -top-0 left-1/2 h-5 w-20 -translate-x-1/2 px-2"
          style={{ background: `${m.warna}55` }}
        />
        <div className="flex items-center gap-2">
          <span
            className="rounded-lg px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white"
            style={{ background: m.warna }}
          >
            {m.kode}
          </span>
          <SksCap sks={m.sks} />
          <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {bolehUbah && (
              <button onClick={() => (onEdit ? onEdit() : setBukaUbah(true))} title="Ubah info matkul" className="rounded-lg bg-white/70 p-1.5 text-(--color-soft) hover:text-(--color-ink)">
                <PencilLine size={15} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} title="Hapus" className="rounded-lg bg-white/70 p-1.5 text-(--color-soft) hover:text-(--color-apel)">
                <Trash2 size={15} />
              </button>
            )}
          </span>
        </div>
        <h3 className="font-display mt-2 text-[22px] font-bold leading-tight">
          {m.nama}
        </h3>
        <p className="mt-0.5 text-[13px] font-bold uppercase tracking-wide text-(--color-soft)">
          {m.dosen.join(" · ")}
        </p>
        <p className="mt-1 text-[12px] font-extrabold uppercase tracking-widest text-(--color-faint)">
          PJ: {namaPj.length > 0 ? <span className="text-(--color-apel)">{namaPj.join(", ")}</span> : "—"}
        </p>
      </div>
      {/* Badan */}
      <div className="flex flex-1 flex-col px-5 pb-4 pt-3">
        {m.jadwal.map((j, i) => (
          <p key={i} className="text-[14px] font-semibold text-(--color-soft)">
            {j.hari} · {j.jam}
          </p>
        ))}
        <div className="mt-3 flex items-center gap-2 border-t-2 border-dashed border-(--color-line) pt-3">
          <span className="text-[13px] font-bold text-(--color-soft)">Semester {m.semester}</span>
          {terbatas && (
            <span className="rounded-full bg-(--color-sky-soft) px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-(--color-sky)">
              {(m.anggotaIds ?? []).length} peserta
            </span>
          )}
          {aktif > 0 && (
            <span className="sticker bg-(--color-apel-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-apel)">
              {aktif} tugas!
            </span>
          )}
          <Link
            href={`/matkul/${m.id}`}
            className="btn-hard ml-auto flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-extrabold text-white"
            style={{ background: m.warna }}
          >
            RPS & Detail <ArrowRight size={15} strokeWidth={3} />
          </Link>
        </div>
      </div>
      {bukaUbah && <ModalUbahMatkul matkulId={m.id} onTutup={() => setBukaUbah(false)} />}
    </article>
  );
}
