"use client";

import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { nomorPertemuan } from "@/lib/data";
import { PertemuanCap } from "@/components/bits";
import { DrivePreview } from "@/components/drive-preview";

type IsiItem = { id: string; nama: string; jenis: "file" | "folder"; url: string };

/**
 * Isi folder root Drive: fetch sekali saat rootId berubah (via effect yang benar),
 * kelompokkan folder "Pertemuan N" otomatis. File tetap di Drive.
 */
export function IsiDrive({ rootId }: { rootId: string }) {
  const [isi, setIsi] = useState<IsiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState<string | null>(null);
  const [at, setAt] = useState("");
  const [ulang, setUlang] = useState(0);

  useEffect(() => {
    let batal = false;
    // Reset status fetch tiap rootId/ulang berubah — pola fetch standar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setPesan(null);
    fetch(`/api/drive/isi?id=${encodeURIComponent(rootId)}`)
      .then((r) => r.json() as Promise<{ ok: boolean; pesan?: string; items?: IsiItem[] }>)
      .then((json) => {
        if (batal) return;
        setIsi(Array.isArray(json.items) ? json.items : []);
        if (!json.ok) setPesan(json.pesan ?? "Gagal membaca isi Drive.");
        else if (!json.items?.length)
          setPesan("Folder root kosong / tak terbaca. Cek sharing “Anyone with link – Viewer”.");
        setAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {
        if (!batal) setPesan("Gagal menghubungi Drive. Coba muat ulang.");
      })
      .finally(() => {
        if (!batal) setLoading(false);
      });
    return () => {
      batal = true;
    };
  }, [rootId, ulang]);

  const seksi = new Map<number, IsiItem[]>();
  const lain: IsiItem[] = [];
  for (const it of isi) {
    const n = nomorPertemuan(it.nama);
    if (n !== null) {
      if (!seksi.has(n)) seksi.set(n, []);
      seksi.get(n)!.push(it);
    } else {
      lain.push(it);
    }
  }
  const urut = [...seksi.entries()].sort(([a], [b]) => a - b);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setUlang((u) => u + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest hover:bg-(--color-cream) disabled:opacity-60"
        >
          <RotateCw size={14} strokeWidth={2.6} /> {loading ? "Memuat…" : `Muat ulang${at ? ` · ${at}` : ""}`}
        </button>
      </div>
      {loading && (
        <p className="paper-card mt-4 p-5 text-center text-[14px] font-bold text-(--color-soft)">
          Membaca isi Drive…
        </p>
      )}
      {!loading && urut.length === 0 && lain.length === 0 && (
        <p className="paper-card mt-4 p-5 text-center text-[14px] font-medium text-(--color-faint)">
          {pesan ?? "Belum ada Pertemuan terbaca. Buat folder “Pertemuan 1”, “Pertemuan 2” di dalam folder root, lalu Muat ulang."}
        </p>
      )}
      {!loading && pesan && (urut.length > 0 || lain.length > 0) && (
        <p className="mt-4 rounded-2xl bg-(--color-lemon-soft) p-4 text-[13px] font-bold text-(--color-soft)">
          {pesan}
        </p>
      )}
      {urut.map(([n, daftar]) => (
        <section key={n} className="mt-5">
          <h2 className="font-display mb-2.5 flex items-center gap-2 text-[22px] font-bold">
            <PertemuanCap n={n} />
            <span className="tnum text-[15px] font-bold text-(--color-faint)">({daftar.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {daftar.map((it) => (
              <DrivePreview key={it.id} judul={it.nama} url={it.url} deskripsi={it.jenis === "folder" ? "Folder · ketuk Preview untuk lihat isi" : "File"} />
            ))}
          </div>
        </section>
      ))}
      {lain.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display mb-2.5 text-[22px] font-bold">
            Lainnya <span className="tnum text-[15px] font-bold text-(--color-faint)">({lain.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {lain.map((it) => (
              <DrivePreview key={it.id} judul={it.nama} url={it.url} deskripsi={it.jenis === "folder" ? "Folder" : "File"} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
