"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FolderOpen, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { driveInfoDari, matkulTerlihat, urlAman } from "@/lib/data";
import { Shell } from "@/components/shell";
import { PertemuanCap } from "@/components/bits";
import { DrivePreview } from "@/components/drive-preview";
import { IsiDrive } from "@/components/isi-drive";
import { ConfirmModal } from "@/components/confirm";

/**
 * Detail materi 1 matkul — MODE ROOT OTOMATIS:
 * Admin pasang 1 link folder root (mis. PPD). Isi root (Pertemuan 1, 2, …)
 * terbaca otomatis, tak perlu tambah manual di app. File tetap di Drive.
 */
export default function MateriDetail() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { matkulById, tautan, hapusTautan, updateMatkul, user } = useStore();
  const [tanyaId, setTanyaId] = useState<string | null>(null);
  const [driveEdit, setDriveEdit] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveErr, setDriveErr] = useState<string | null>(null);

  const m = matkulById(id);
  const ikut = m && user ? matkulTerlihat(m, user) : false;
  const adminSaja = user?.role === "admin";

  const infoRoot = driveInfoDari(m?.driveUrl ?? "");
  const rootId = infoRoot.jenis === "folder" ? infoRoot.id : null;

  const manual = useMemo(() => {
    const map = new Map<number, typeof tautan>();
    for (const t of tautan.filter((x) => x.matkulId === id && x.kategori === "materi")) {
      const k = t.pertemuan ?? 0;
      if (k <= 0) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [tautan, id]);

  if (!m)
    return (
      <Shell>
        <p className="paper-card p-6 text-[15px]">
          Matkul tidak ditemukan. <Link href="/materi" className="font-bold underline">Kembali</Link>
        </p>
      </Shell>
    );
  if (!ikut)
    return (
      <Shell>
        <div className="paper-card p-6 text-center">
          <p className="font-display text-[24px] font-bold">Kamu tidak mengambil matkul ini</p>
          <p className="mt-1 text-[15px] text-(--color-soft)">
            {m.nama} hanya untuk peserta terdaftar. Hubungi admin bila seharusnya kamu ikut.
          </p>
          <Link href="/materi" className="btn-hard mt-4 inline-block rounded-full bg-(--color-ink) px-6 py-2.5 text-[14px] font-extrabold text-[#fff6e8] dark:text-[#181222]">
            Kembali ke materi
          </Link>
        </div>
      </Shell>
    );

  function simpanDrive(e: React.FormEvent) {
    e.preventDefault();
    if (user?.role !== "admin") {
      setDriveErr("Hanya admin yang boleh pasang folder Drive.");
      return;
    }
    const mentah = driveUrl.trim();
    if (!mentah) {
      updateMatkul(m!.id, { driveUrl: "" });
      setDriveUrl("");
      setDriveErr(null);
      setDriveEdit(false);
      return;
    }
    const bersih = urlAman(mentah);
    if (!bersih) {
      setDriveErr("Link Drive tidak valid. Pakai http(s).");
      return;
    }
    if (driveInfoDari(bersih).jenis !== "folder") {
      setDriveErr("Harus link FOLDER Drive (…/drive/folders/…), bukan file.");
      return;
    }
    updateMatkul(m!.id, { driveUrl: bersih });
    setDriveUrl("");
    setDriveErr(null);
    setDriveEdit(false);
  }

  function bolehHapus(t: { olehId?: string; oleh: string }) {
    if (!user) return false;
    if (t.olehId ? t.olehId === user.id : t.oleh === user.nama) return true;
    return user.role === "admin";
  }

  return (
    <Shell>
      <Link href="/materi" className="flex w-fit items-center gap-1.5 rounded-full bg-(--color-card) px-4 py-2 text-[13px] font-extrabold text-(--color-soft) hover:text-(--color-ink)">
        <ArrowLeft size={15} strokeWidth={3} /> SEMUA MATERI
      </Link>

      <header className="paper-card mt-3 overflow-hidden">
        <div className="px-5 pb-5 pt-5 md:px-6" style={{ background: `${m.warna}20` }}>
          <span className="tape block h-5 w-24" style={{ background: `${m.warna}55` }} />
          <p className="mt-2 text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft)">
            {m.kode} · {m.dosen.join(" · ")}
          </p>
          <h1 className="font-display mt-1 text-[26px] font-bold leading-tight sm:text-[32px]">{m.nama}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.driveUrl ? (
              <a
                href={m.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hard flex items-center gap-1.5 rounded-full bg-(--color-ink) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]"
              >
                <FolderOpen size={14} strokeWidth={2.6} /> Buka Drive matkul
              </a>
            ) : (
              <span className="rounded-full border-2 border-dashed border-(--color-line) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                Belum ada folder Drive matkul
              </span>
            )}
            {adminSaja && (
              <button
                onClick={() => {
                  setDriveErr(null);
                  setDriveUrl(m.driveUrl ?? "");
                  setDriveEdit(true);
                }}
                className="rounded-full border-2 border-(--color-line) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft) hover:bg-(--color-cream)"
              >
                {m.driveUrl ? "Ganti Drive" : "Pasang Drive"}
              </button>
            )}
          </div>
          <p className="mt-2 text-[13px] font-medium text-(--color-soft)">
            {rootId
              ? "Isi terbaca otomatis dari folder Drive. Tambah folder “Pertemuan N” di Drive, lalu Muat ulang di bawah."
              : adminSaja
                ? "Pasang 1 link folder root Drive (mis. PPD). Isi Pertemuan N di dalamnya tampil otomatis."
                : "Menunggu admin pasang folder Drive matkul ini."}
          </p>
        </div>
      </header>

      {rootId ? (
        <IsiDrive rootId={rootId} />
      ) : (
        <>
          {manual.map(([k, daftar]) => (
            <section key={k} className="mt-5">
              <h2 className="font-display mb-2.5 flex items-center gap-2 text-[22px] font-bold">
                <PertemuanCap n={k} />
                <span className="tnum text-[15px] font-bold text-(--color-faint)">({daftar.length})</span>
              </h2>
              <div className="flex flex-col gap-2.5">
                {daftar.map((t) => (
                  <div key={t.id} className="relative">
                    <DrivePreview judul={t.judul} url={t.url} deskripsi={t.deskripsi || `oleh ${t.oleh}`} />
                    {bolehHapus(t) && (
                      <button
                        onClick={() => setTanyaId(t.id)}
                        title="Hapus tautan"
                        className="absolute right-3 top-3 rounded-xl border-2 border-(--color-line) bg-(--color-card) p-2 text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {manual.length === 0 && (
            <p className="paper-card mt-5 p-5 text-center text-[14px] font-medium text-(--color-faint)">
              Belum ada materi. {adminSaja ? "Pasang folder Drive lewat tombol di atas." : "Menunggu admin."}
            </p>
          )}
        </>
      )}

      {driveEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={() => setDriveEdit(false)}>
          <form
            onSubmit={simpanDrive}
            onClick={(e) => e.stopPropagation()}
            className="paper-card my-8 w-full max-w-md !rounded-3xl p-5 md:p-6"
          >
            <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
              <FolderOpen size={20} /> Folder Drive matkul
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
              Khusus admin · 1x pasang. Link folder root {m.nama} (mis. PPD berisi Pertemuan 1, 2, …). Kosongkan untuk melepas.
            </p>
            <input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              inputMode="url"
              className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none"
            />
            {driveErr && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{driveErr}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDriveEdit(false)}
                className="rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:bg-(--color-cream)"
              >
                Batal
              </button>
              <button type="submit" className="btn-hard rounded-full bg-(--color-ink) px-4 py-2.5 text-[14px] font-extrabold text-[#fff6e8] dark:text-[#181222]">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={tanyaId !== null}
        bahaya
        judul="Hapus materi ini?"
        pesan="Tautan hilang dari semua akun (file di Drive tetap ada). Yakin?"
        batalLabel="Batal"
        yaLabel="Ya, hapus"
        onBatal={() => setTanyaId(null)}
        onYa={() => {
          if (tanyaId) hapusTautan(tanyaId);
          setTanyaId(null);
        }}
      />
    </Shell>
  );
}
