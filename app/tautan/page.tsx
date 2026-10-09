"use client";

import { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
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

export default function TautanPage() {
  const { user, tautan, matkul, addTautan, hapusTautan } = useStore();
  const [filterMk, setFilterMk] = useState("semua");
  const [filterKat, setFilterKat] = useState("semua");
  const [fJudul, setFJudul] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fKat, setFKat] = useState<KategoriTautan>("kumpul");
  const [fMk, setFMk] = useState("");
  const [fDesk, setFDesk] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);

  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const bolehId = new Set(matkulSaya.map((m) => m.id));
  const daftar = tautan
    .filter((t) => !t.matkulId || bolehId.has(t.matkulId))
    .filter((t) => filterMk === "semua" || (t.matkulId || "kelas") === filterMk)
    .filter((t) => filterKat === "semua" || t.kategori === filterKat);

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const gagal = addTautan({
      matkulId: fMk,
      judul: fJudul,
      url: fUrl,
      kategori: fKat,
      deskripsi: fDesk,
    });
    if (gagal) setErr(gagal);
    else {
      setFJudul("");
      setFUrl("");
      setFDesk("");
      setErr(null);
    }
  }

  function bolehHapus(t: (typeof tautan)[number]) {
    if (!user) return false;
    if (t.olehId ? t.olehId === user.id : t.oleh === user.nama) return true;
    if (user.role === "admin") return true;
    return !!t.matkulId && matkul.some((m) => m.id === t.matkulId && (m.pjIds ?? []).includes(user.id));
  }

  return (
    <Shell>
      <SectionTitle
        no={<Link2 size={22} />}
        title="Tautan Penting"
        desc="Link kumpul GDrive, materi, spreadsheet data kelas — satu pintu, tidak tenggelam di chat."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterMk}
          onChange={(e) => setFilterMk(e.target.value)}
          className="field cursor-pointer px-4 py-2.5 text-[15px] font-bold"
        >
          <option value="semua">Semua ruang</option>
          <option value="kelas">Milik kelas</option>
          {matkulSaya.map((m) => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
        <select
          value={filterKat}
          onChange={(e) => setFilterKat(e.target.value)}
          className="field cursor-pointer px-4 py-2.5 text-[15px] font-bold"
        >
          <option value="semua">Semua jenis</option>
          {KATEGORI.map((k) => (
            <option key={k} value={k}>{LABEL_KATEGORI[k]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {daftar.map((t) => {
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
                  <p className="mt-0.5 text-[14px] text-(--color-soft)">{t.deskripsi}</p>
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
            Belum ada tautan. Tambahkan link kumpul / materi pertama di bawah!
          </p>
        )}
      </div>

      <form onSubmit={kirim} className="paper-card mt-5 p-4 md:p-5">
        <p className="font-display text-[20px] font-bold">Tambah tautan</p>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          Pilih ruang: milik kelas (semua anak) atau matkul tertentu (hanya pesertanya).
        </p>
        <div className="mt-2.5 grid gap-2 md:grid-cols-2">
          <input
            value={fJudul}
            onChange={(e) => setFJudul(e.target.value)}
            placeholder="Judul, mis. Kumpul Esai PLB GDrive"
            className="field px-4 py-2.5 text-[15px] outline-none"
            required
            maxLength={120}
          />
          <input
            value={fUrl}
            onChange={(e) => setFUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            className="field px-4 py-2.5 text-[15px] outline-none"
            required
          />
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
          <input
            value={fDesk}
            onChange={(e) => setFDesk(e.target.value)}
            placeholder="Keterangan singkat (opsional)"
            className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2"
            maxLength={500}
          />
        </div>
        {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
        <button type="submit" className="btn-hard mt-2.5 flex items-center gap-1.5 rounded-full bg-(--color-daun) px-6 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-white">
          <Plus size={15} strokeWidth={3} /> Simpan tautan
        </button>
      </form>

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
