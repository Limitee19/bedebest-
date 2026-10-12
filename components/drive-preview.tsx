"use client";

import { useState } from "react";
import { ExternalLink, Eye, FolderOpen } from "lucide-react";
import { bisaPreviewDrive, domainDari, driveEmbedDari, driveInfoDari } from "@/lib/data";

/**
 * Kartu link Drive: tombol "Buka Drive" + "Preview di App".
 * File tetap di Drive (kuota Drive), app cuma embed preview.
 * Butuh sharing "Anyone with link - Viewer", kalau tidak iframe 403.
 */
export function DrivePreview({ judul, url, deskripsi }: { judul: string; url: string; deskripsi?: string }) {
  const [buka, setBuka] = useState(false);
  const info = driveInfoDari(url);
  const embed = driveEmbedDari(info);
  const bisa = embed !== null && bisaPreviewDrive(url);
  return (
    <div className="paper-card min-w-0 !rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-(--color-sky-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-sky)">
          {info.jenis === "folder" ? "Folder Drive" : info.jenis === "dokumen" ? "Dokumen" : info.jenis === "file" ? "File Drive" : domainDari(url)}
        </span>
        {deskripsi && <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-(--color-soft)">{deskripsi}</span>}
      </div>
      <p className="mt-1 truncate text-[16px] font-extrabold leading-snug" title={judul}>
        {judul}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-hard flex items-center gap-1.5 rounded-full bg-(--color-ink) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]"
        >
          <FolderOpen size={14} strokeWidth={2.6} /> Buka Drive
        </a>
        {bisa ? (
          <button
            onClick={() => setBuka((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest hover:bg-(--color-cream)"
          >
            <Eye size={14} strokeWidth={2.6} /> {buka ? "Tutup" : "Preview di App"}
          </button>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft)"
          >
            <ExternalLink size={14} /> Buka tab baru
          </a>
        )}
      </div>
      {buka && embed && (
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-(--color-line)">
          <iframe
            src={embed}
            title={`Preview ${judul}`}
            className="h-[420px] w-full bg-white"
            loading="lazy"
            allow="autoplay; fullscreen"
          />
          <p className="bg-(--color-cream) px-3 py-2 text-[12px] font-semibold text-(--color-soft)">
            Preview live dari Drive — tambah file di Drive lalu muat ulang halaman ini. Kosong/403 = ubah sharing jadi “Anyone with link – Viewer”.
          </p>
        </div>
      )}
    </div>
  );
}
