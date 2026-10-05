"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { sudahSelesai, useStore } from "@/lib/store";
import type { Tugas } from "@/lib/data";
import { fmtPendek, labelSisa, PertemuanCap, PrioritasCap, sisaHari } from "./bits";
import { ConfirmModal } from "./confirm";

export function TugasRow({ t, showMatkul = true }: { t: Tugas; showMatkul?: boolean }) {
  const { user, matkulById, toggleSelesai } = useStore();
  const [tanya, setTanya] = useState(false);
  const m = matkulById(t.matkulId);
  const s = sisaHari(t.deadline);
  const done = sudahSelesai(t, user?.id);
  const jml = (t.selesaiOleh ?? []).length;

  function tekan() {
    if (done) toggleSelesai(t.id); // batalkan: tanpa konfirmasi, tidak berbahaya
    else setTanya(true);
  }

  return (
    <>
      <div className={`paper-card flex items-start gap-3 p-4 ${done ? "opacity-75" : ""}`}>
        <button
          title={done ? "Batalkan tanda selesai" : "Tandai selesai"}
          onClick={tekan}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2.5px] transition-all ${
            done
              ? "border-(--color-daun) bg-(--color-daun) text-white"
              : "border-(--color-faint) hover:scale-110 hover:border-(--color-daun)"
          }`}
        >
          {done && <Check size={15} strokeWidth={4} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {showMatkul && m && (
              <Link
                href={`/matkul/${m.id}`}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white hover:opacity-85"
                style={{ background: m.warna }}
              >
                {m.nama}
              </Link>
            )}
            <PrioritasCap p={t.prioritas} />
          <PertemuanCap n={t.pertemuan} />
            {t.status === "usulan" && (
              <span className="sticker bg-(--color-lemon-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-lemon)">
                Usulan, tunggu PJ
              </span>
            )}
            {done && (
              <span className="sticker bg-(--color-daun-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-daun)">
                Selesai olehmu!
              </span>
            )}
          </div>
          <p className={`mt-1.5 text-[16px] font-bold leading-snug ${done ? "line-through opacity-70" : ""}`}>
            {t.judul}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-(--color-soft)">
            {s < 0 && !done ? (
              <span className="font-extrabold text-(--color-apel)">{labelSisa(t.deadline)}</span>
            ) : (
              <span className="font-extrabold text-(--color-ink)">{labelSisa(t.deadline)}</span>
            )}{" "}
            · dikumpulkan {fmtPendek(t.deadline)}
            {jml > 0 && (
              <span className="text-(--color-faint)">
                {" "}· {jml} teman sudah selesai
              </span>
            )}
          </p>
        </div>
      </div>

      <ConfirmModal
        open={tanya}
        judul="Tugasnya sudah beres?"
        pesan={`"${t.judul}" akan ditandai selesai di akunmu. Pastikan sudah dikumpulkan ya! Teman lain tidak ikut terpengaruh.`}
        onBatal={() => setTanya(false)}
        onYa={() => {
          toggleSelesai(t.id);
          setTanya(false);
        }}
      />
    </>
  );
}
