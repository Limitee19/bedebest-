"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { sudahSelesai, useStore } from "@/lib/store";
import type { Tugas } from "@/lib/data";
import { fmtPendek, labelSisa, PertemuanCap, PrioritasCap, sisaHari } from "./bits";
import { ConfirmModal } from "./confirm";

export function TugasRow({ t, showMatkul = true }: { t: Tugas; showMatkul?: boolean }) {
  const { user, matkulById, toggleSelesai, toggleSubtask } = useStore();
  const [tanya, setTanya] = useState(false);
  const [buka, setBuka] = useState(false);
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
      <div className={`paper-card p-4 ${done ? "opacity-75" : ""}`}>
        <div className="flex items-start gap-3">
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
            <button onClick={() => setBuka((v) => !v)} className="mt-1.5 block w-full text-left">
              <span className={`text-[16px] font-bold leading-snug ${done ? "line-through opacity-70" : ""}`}>
                {t.judul}
              </span>
            </button>
            <button
              onClick={() => setBuka((v) => !v)}
              className="mt-1 flex w-full items-center gap-1 text-left text-[13px] font-semibold text-(--color-soft)"
            >
              {s < 0 && !done ? (
                <span className="font-extrabold text-(--color-apel)">{labelSisa(t.deadline)}</span>
              ) : (
                <span className="font-extrabold text-(--color-ink)">{labelSisa(t.deadline)}</span>
              )}
              <span>· dikumpulkan {fmtPendek(t.deadline)}</span>
              {jml > 0 && (
                <span className="text-(--color-faint)">
                  {" "}· {jml} teman sudah selesai
                </span>
              )}
              <ChevronDown
                size={15}
                strokeWidth={3}
                className={`ml-auto shrink-0 transition-transform ${buka ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {buka && (
          <div className="mt-3 border-t-2 border-dashed border-(--color-line) pt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
              Rincian tugas
            </p>
            <p className="mt-1 text-[15px] leading-relaxed">{t.deskripsi}</p>
            {t.subtask.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {t.subtask.map((sub, i) => (
                  <li key={i}>
                    <button onClick={() => toggleSubtask(t.id, i)} className="flex items-center gap-2 text-[14px] font-medium">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] text-[12px] font-black text-white ${sub.done ? "border-(--color-daun) bg-(--color-daun)" : "border-(--color-faint)"}`}>
                        {sub.done && <Check size={12} strokeWidth={4} />}
                      </span>
                      <span className={sub.done ? "line-through opacity-60" : ""}>{sub.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2.5 text-[12px] font-bold uppercase tracking-widest text-(--color-faint)">
              {t.disimpulkanOleh ? `Disimpulkan oleh ${t.disimpulkanOleh}` : `Dilaporkan oleh ${t.dibuatOleh}`}
            </p>
          </div>
        )}
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
