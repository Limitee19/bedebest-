"use client";

import { CheckCircle2, Siren } from "lucide-react";
import { useStore } from "@/lib/store";

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  const ok = toast.jenis === "ok";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <div
        key={toast.id}
        className={`paper-card flex max-w-md items-center gap-2.5 !rounded-full px-4 py-2.5 text-[14px] font-extrabold shadow-lg ${
          ok ? "" : "!border-(--color-apel)"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            ok ? "bg-(--color-daun-soft) text-(--color-daun)" : "bg-(--color-apel-soft) text-(--color-apel)"
          }`}
        >
          {ok ? <CheckCircle2 size={17} /> : <Siren size={17} />}
        </span>
        <span className="leading-snug">{toast.teks}</span>
      </div>
    </div>
  );
}
