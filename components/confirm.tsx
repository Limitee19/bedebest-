"use client";

import { useEffect } from "react";
import { PartyPopper, Trash2 } from "lucide-react";

export function ConfirmModal({
  open,
  judul,
  pesan,
  yaLabel = "Sudah dong!",
  batalLabel = "Belum, nanti",
  bahaya = false,
  onYa,
  onBatal,
}: {
  open: boolean;
  judul: string;
  pesan: string;
  yaLabel?: string;
  batalLabel?: string;
  /** true = merah (hapus), false = hijau (konfirmasi biasa) */
  bahaya?: boolean;
  onYa: () => void;
  onBatal: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBatal();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onBatal]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onBatal}
    >
      <div
        className="paper-card w-full max-w-sm !rounded-3xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`mx-auto flex h-16 w-16 rotate-[-6deg] items-center justify-center rounded-3xl ${bahaya ? "bg-(--color-apel-soft)" : "bg-(--color-daun-soft)"}`}>
          {bahaya ? (
            <Trash2 size={30} className="text-(--color-apel)" />
          ) : (
            <PartyPopper size={30} className="text-(--color-daun)" />
          )}
        </span>
        <h3 className="font-display mt-3 text-[24px] font-bold leading-tight">{judul}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-(--color-soft)">{pesan}</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={onBatal}
            className="rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:bg-(--color-cream)"
          >
            {batalLabel}
          </button>
          <button
            onClick={onYa}
            className={`btn-hard rounded-full px-4 py-2.5 text-[14px] font-extrabold text-white ${bahaya ? "bg-(--color-apel)" : "bg-(--color-daun)"}`}
          >
            {yaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
