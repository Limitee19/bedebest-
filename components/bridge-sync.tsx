"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

declare global {
  interface Window {
    BeDeBestSync?: { postMessage: (msg: string) => void };
    BeDeBestBuka?: { postMessage: (msg: string) => void };
  }
}

export function BridgeSync() {
  const { user, matkul, tugas } = useStore();
  const terakhir = useRef(0);

  useEffect(() => {
    function teruskan(e: MouseEvent) {
      try {
        const ch = window.BeDeBestBuka;
        if (!ch) return;
        const el = (e.target as HTMLElement | null)?.closest?.("a");
        if (!el) return;
        const href = el.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href)) return;
        const u = new URL(href, window.location.href);
        if (u.host === window.location.host) return;
        e.preventDefault();
        e.stopPropagation();
        ch.postMessage(u.toString());
      } catch {
        /* abaikan */
      }
    }
    document.addEventListener("click", teruskan, true);
    return () => document.removeEventListener("click", teruskan, true);
  }, []);

  useEffect(() => {
    try {
      const ch = typeof window !== "undefined" ? window.BeDeBestSync : undefined;
      if (!ch) return;
      const now = Date.now();
      if (now - terakhir.current < 2000) return;
      terakhir.current = now;
      const payload = JSON.stringify({
        at: now,
        user: user
          ? { id: user.id, nama: user.nama, role: user.role }
          : null,
        matkul: matkul.map((m) => ({
          id: m.id,
          nama: m.nama,
          dosen: m.dosen ?? [],
          jadwal: m.jadwal,
          pj_ids: m.pjIds ?? [],
          anggota_ids: m.anggotaIds ?? [],
        })),
        tugas: tugas.slice(0, 500).map((t) => ({
          id: t.id,
          matkul_id: t.matkulId,
          judul: t.judul,
          deadline_at: t.deadline,
          status: t.status,
          selesai_oleh: t.selesaiOleh ?? [],
          arsip: !!t.arsip,
        })),
      });
      ch.postMessage(payload);
    } catch {
      /* abaikan */
    }
  }, [user, matkul, tugas]);

  return null;
}
