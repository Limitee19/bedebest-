"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FolderOpen, Plus, RotateCw, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { matkulTerlihat, urlAman } from "@/lib/data";
import { Shell } from "@/components/shell";
import { PertemuanCap } from "@/components/bits";
import { DrivePreview } from "@/components/drive-preview";
import { ConfirmModal } from "@/components/confirm";

const MAX_PERTEMUAN = 16;

/** Detail materi 1 matkul: 2 tombol (Buka Drive + Preview di App per folder), grup Pertemuan virtual. */
export default function MateriDetail() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { matkul, matkulById, tautan, addTautan, hapusTautan, updateMatkul, user, bisaSimpulkan } = useStore();
  const [buka, setBuka] = useState(false);
  const [judul, setJudul] = useState("");
  const [url, setUrl] = useState("");
  const [pertemuan, setPertemuan] = useState("1");
  const [desk, setDesk] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);
  const [driveEdit, setDriveEdit] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveErr, setDriveErr] = useState<string | null>(null);

  const m = matkulById(id);
  const ikut = m && user ? matkulTerlihat(m, user) : false;
  const bolehUbah = m ? bisaSimpulkan(m.id) : false;

  const materi = useMemo(
    () => tautan.filter((t) => t.matkulId === id && t.kategori === "materi"),
    [tautan, id]
  );

  const grup = useMemo(() => {
    const map = new Map<number | "x", typeof materi>();
    for (const t of materi) {
      const k = t.pertemuan ?? "x";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    const angka = [...map.entries()]
      .filter(([k]) => k !== "x")
      .sort(([a], [b]) => (a as number) - (b as number));
    const tanpa = map.get("x") ?? [];
    return { angka, tanpa };
  }, [materi]);

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

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(pertemuan, 10);
    const gagal = addTautan({
      matkulId: m!.id,
      judul,
      url,
      kategori: "materi",
      deskripsi: desk,
      pertemuan: Number.isNaN(n) ? undefined : Math.max(1, Math.min(MAX_PERTEMUAN, n)),
    });
    if (gagal) {
      setErr(gagal);
      return;
    }
    setJudul("");
    setUrl("");
    setPertemuan("1");
    setDesk("");
    setErr(null);
    setBuka(false);
  }

  function simpanDrive(e: React.FormEvent) {
    e.preventDefault();
    const bersih = driveUrl.trim() ? urlAman(driveUrl) : null;
    if (driveUrl.trim() && !bersih) {
      setDriveErr("Link Drive tidak valid. Pakai http(s).");
      return;
    }
    updateMatkul(m!.id, { driveUrl: bersih ?? "" });
    setDriveUrl("");
    setDriveErr(null);
    setDriveEdit(false);
  }

  function bolehHapus(t: (typeof materi)[number]) {
    if (!user) return false;
    if (t.olehId ? t.olehId === user.id : t.oleh === user.nama) return true;
    if (user.role === "admin") return true;
    return matkul.some((mm) => mm.id === m!.id && (mm.pjIds ?? []).includes(user.id));
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
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest hover:bg-(--color-cream)"
            >
              <RotateCw size={14} strokeWidth={2.6} /> Muat ulang
            </button>
            {bolehUbah && (
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
            File tetap di Drive — tambah file di Drive, lalu muat ulang halaman ini. Preview di bawah live dari Drive.
          </p>
          <button
            onClick={() => {
              setErr(null);
              setBuka(true);
            }}
            className="btn-hard mt-3 flex items-center gap-1.5 rounded-full bg-(--color-daun) px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-widest text-white"
          >
            <Plus size={14} strokeWidth={3} /> Tambah folder / file
          </button>
        </div>
      </header>

      {/* Pertemuan 1 selalu tampil walau kosong */}
      <section className="mt-5">
        <h2 className="font-display mb-2.5 flex items-center gap-2 text-[22px] font-bold">
          <PertemuanCap n={1} />
          <span className="tnum text-[15px] font-bold text-(--color-faint)">
            ({grup.angka.find(([k]) => k === 1)?.[1].length ?? 0})
          </span>
        </h2>
        <div className="flex flex-col gap-2.5">
          {(grup.angka.find(([k]) => k === 1)?.[1] ?? []).map((t) => (
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
          {(grup.angka.find(([k]) => k === 1)?.[1].length ?? 0) === 0 && (
            <p className="paper-card p-5 text-center text-[14px] font-medium text-(--color-faint)">
              Pertemuan 1 masih kosong. Tambahkan link folder/file Drive pertama lewat tombol di atas!
            </p>
          )}
        </div>
      </section>

      {/* Pertemuan 2+ yang ada isinya */}
      {grup.angka
        .filter(([k]) => k !== 1)
        .map(([k, daftar]) => (
          <section key={String(k)} className="mt-5">
            <h2 className="font-display mb-2.5 flex items-center gap-2 text-[22px] font-bold">
              <PertemuanCap n={k as number} />
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

      {/* Tanpa label pertemuan */}
      {grup.tanpa.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display mb-2.5 text-[22px] font-bold">
            Lainnya <span className="tnum text-[15px] font-bold text-(--color-faint)">({grup.tanpa.length})</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {grup.tanpa.map((t) => (
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
      )}

      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={() => setBuka(false)}>
          <form
            onSubmit={kirim}
            onClick={(e) => e.stopPropagation()}
            className="paper-card my-8 w-full max-w-md !rounded-3xl p-5 md:p-6"
          >
            <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
              <Plus size={20} /> Tambah materi
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
              Tempel link Drive (file / folder / Docs). File tetap di Drive, app cuma preview.
            </p>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul, mis. Pakaian Asal Tiongkok"
              className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none"
              required
              maxLength={120}
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/…"
              inputMode="url"
              className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none"
              required
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={pertemuan} onChange={(e) => setPertemuan(e.target.value)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
                {Array.from({ length: MAX_PERTEMUAN }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>Pertemuan {i + 1}</option>
                ))}
              </select>
              <input
                value={desk}
                onChange={(e) => setDesk(e.target.value)}
                placeholder="Keterangan (opsional)"
                className="field px-4 py-2.5 text-[15px] outline-none"
                maxLength={500}
              />
            </div>
            {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBuka(false)}
                className="rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:bg-(--color-cream)"
              >
                Batal
              </button>
              <button type="submit" className="btn-hard rounded-full bg-(--color-daun) px-4 py-2.5 text-[14px] font-extrabold text-white">
                Simpan
              </button>
            </div>
          </form>
        </div>
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
              Link folder Drive utama {m.nama}. Kosongkan untuk melepas.
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
