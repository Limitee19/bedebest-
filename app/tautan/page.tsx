"use client";

import { useState } from "react";
import { ExternalLink, Link2, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  LABEL_KATEGORI,
  domainDari,
  matkulTerlihat,
  type KategoriTautan,
} from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import { ConfirmModal } from "@/components/confirm";

const KATEGORI: KategoriTautan[] = ["kumpul", "materi", "data", "lainnya"];
const BATAS_AWAL = 8;
const TAMBAH = 12;

export default function TautanPage() {
  const { user, tautan, matkul, addTautan, hapusTautan } = useStore();
  const [filterMk, setFilterMk] = useState("semua");
  const [filterKat, setFilterKat] = useState("semua");
  const [cari, setCari] = useState("");
  const [batas, setBatas] = useState(BATAS_AWAL);
  const [tambahBuka, setTambahBuka] = useState(false);
  const [fJudul, setFJudul] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fKat, setFKat] = useState<KategoriTautan>("kumpul");
  const [fMk, setFMk] = useState("");
  const [fDesk, setFDesk] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);

  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const bolehId = new Set(matkulSaya.map((m) => m.id));
  const kunci = cari.trim().toLowerCase();
  const daftar = tautan
    .filter((t) => !t.matkulId || bolehId.has(t.matkulId))
    .filter((t) => filterMk === "semua" || (t.matkulId || "kelas") === filterMk)
    .filter((t) => filterKat === "semua" || t.kategori === filterKat)
    .filter((t) =>
      !kunci
        ? true
        : `${t.judul} ${t.deskripsi} ${domainDari(t.url)}`.toLowerCase().includes(kunci)
    );

  const tampil = daftar.slice(0, batas);
  const sisa = daftar.length - tampil.length;

  function resetBatas() {
    setBatas(BATAS_AWAL);
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const gagal = addTautan({
      matkulId: fMk,
      judul: fJudul,
      url: fUrl,
      kategori: fKat,
      deskripsi: fDesk,
    });
    if (gagal) {
      setErr(gagal);
      return;
    }
    setFJudul("");
    setFUrl("");
    setFDesk("");
    setErr(null);
    setTambahBuka(false);
  }

  function bolehHapus(t: (typeof tautan)[number]) {
    if (!user) return false;
    if (t.olehId ? t.olehId === user.id : t.oleh === user.nama) return true;
    if (user.role === "admin") return true;
    return !!t.matkulId && matkul.some((m) => m.id === t.matkulId && (m.pjIds ?? []).includes(user.id));
  }

  return (
    <Shell>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-3 sm:gap-y-2">
        <div className="min-w-0 flex-1">
          <SectionTitle
            no={<Link2 size={22} />}
            title="Tautan Penting"
            desc="Link kumpul GDrive, materi, spreadsheet data kelas — satu pintu, tidak tenggelam di chat."
          />
        </div>
        <button
          onClick={() => {
            setErr(null);
            setTambahBuka(true);
          }}
          className="btn-hard flex w-full items-center justify-center gap-1.5 rounded-full bg-(--color-daun) px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-white sm:mt-1 sm:w-auto sm:flex-none sm:px-5 sm:py-2.5"
        >
          <Plus size={15} strokeWidth={3} /> Tambah
        </button>
      </div>

      <div className="mb-2 mt-4 grid gap-2">
        <span className="field flex min-w-0 items-center gap-2 px-4 py-2.5">
          <Search size={16} className="shrink-0 text-(--color-faint)" />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              resetBatas();
            }}
            placeholder="Cari judul / keterangan…"
            className="w-full min-w-0 bg-transparent text-[15px] outline-none"
          />
        </span>
        <span className="grid grid-cols-2 gap-2">
          <select
            value={filterMk}
            onChange={(e) => {
              setFilterMk(e.target.value);
              resetBatas();
            }}
            className="field w-full min-w-0 cursor-pointer truncate px-3 py-2.5 text-[14px] font-bold"
          >
            <option value="semua">Semua ruang</option>
            <option value="kelas">Milik kelas</option>
            {matkulSaya.map((m) => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </select>
          <select
            value={filterKat}
            onChange={(e) => {
              setFilterKat(e.target.value);
              resetBatas();
            }}
            className="field w-full min-w-0 cursor-pointer truncate px-3 py-2.5 text-[14px] font-bold"
          >
            <option value="semua">Semua jenis</option>
            {KATEGORI.map((k) => (
              <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>
            ))}
          </select>
        </span>
      </div>
      <p className="mb-4 text-[13px] font-bold text-(--color-faint)">
        {daftar.length} tautan · tampil {tampil.length}
      </p>

      <div className="flex flex-col gap-3">
        {tampil.map((t) => {
          const m = t.matkulId ? matkul.find((x) => x.id === t.matkulId) : null;
          return (
            <article key={t.id} className="paper-card flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-(--color-daun-soft) text-(--color-daun)">
                <Link2 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-(--color-ink) px-2.5 py-0.5 text-[11px] font-extrabold text-[#fff6e8] dark:text-[#181222]">
                    {LABEL_KATEGORI[t.kategori]}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                    {m ? m.nama : "Milik kelas"} · {domainDari(t.url)}
                  </span>
                </div>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-[17px] font-extrabold leading-snug hover:underline"
                >
                  {t.judul}
                  <ExternalLink size={15} className="shrink-0" />
                </a>
                {t.deskripsi && (
                  <p className="mt-0.5 line-clamp-2 text-[14px] text-(--color-soft)">{t.deskripsi}</p>
                )}
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                  oleh {t.oleh}
                </p>
              </div>
              {bolehHapus(t) && (
                <button
                  onClick={() => setTanyaId(t.id)}
                  title="Hapus tautan"
                  className="shrink-0 rounded-xl border-2 border-(--color-line) p-2 text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </article>
          );
        })}
        {!daftar.length && (
          <p className="paper-card p-6 text-center text-[15px] text-(--color-soft)">
            Tidak ketemu. Ubah kata kunci / filter, atau tambah tautan baru lewat tombol Tambah.
          </p>
        )}
      </div>

      {sisa > 0 && (
        <button
          onClick={() => setBatas((b) => b + TAMBAH)}
          className="mt-4 w-full rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2.5 text-[14px] font-extrabold hover:bg-(--color-cream)"
        >
          Muat {Math.min(sisa, TAMBAH)} lagi ({sisa} tersisa)
        </button>
      )}
      {daftar.length > BATAS_AWAL && tampil.length >= daftar.length && (
        <button
          onClick={() => setBatas(BATAS_AWAL)}
          className="mt-2 w-full rounded-full px-4 py-2 text-[13px] font-extrabold text-(--color-soft) hover:underline"
        >
          Ciutkan ke {BATAS_AWAL} teratas
        </button>
      )}

      {tambahBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={() => setTambahBuka(false)}>
          <form
            onSubmit={kirim}
            onClick={(e) => e.stopPropagation()}
            className="paper-card my-8 w-full max-w-lg !rounded-3xl p-5 md:p-6"
          >
            <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
              <Plus size={20} /> Tambah tautan
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
              Milik kelas = semua anak. Matkul tertentu = hanya pesertanya.
            </p>
            <input
              value={fJudul}
              onChange={(e) => setFJudul(e.target.value)}
              placeholder="Judul, mis. Kumpul Esai PLB GDrive"
              className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none"
              required
              maxLength={120}
            />
            <input
              value={fUrl}
              onChange={(e) => setFUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
              className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none"
              required
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={fKat} onChange={(e) => setFKat(e.target.value as KategoriTautan)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>
                ))}
              </select>
              <select value={fMk} onChange={(e) => setFMk(e.target.value)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
                <option value="">Milik kelas (semua anak)</option>
                {matkulSaya.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>
            <input
              value={fDesk}
              onChange={(e) => setFDesk(e.target.value)}
              placeholder="Keterangan singkat (opsional)"
              className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none"
              maxLength={500}
            />
            {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTambahBuka(false)}
                className="rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:bg-(--color-cream)"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-hard rounded-full bg-(--color-daun) px-4 py-2.5 text-[14px] font-extrabold text-white"
              >
                Simpan tautan
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={tanyaId !== null}
        bahaya
        judul="Hapus tautan ini?"
        pesan="Tautan hilang dari semua akun. Yakin?"
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
