"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

declare global {
  interface Window {
    BeDeBestSync?: { postMessage: (msg: string) => void };
  }
}

/**
 * Jembatan Web → App Flutter (WebView).
 * Tiap store berubah, kirim snapshot ringkas {user, matkul, tugas}
 * ke channel `BeDeBestSync`. App pakai ini untuk widget + notif 30 mnt.
 * Di browser biasa channel tidak ada → diam saja (no-op).
 */
export function BridgeSync() {
  const { user, matkul, tugas } = useStore();
  const terakhir = useRef(0);

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
