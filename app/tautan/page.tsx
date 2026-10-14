"use client";

import { useState } from "react";
import { ExternalLink, ImagePlus, Link2, Palette, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  LABEL_KATEGORI,
  LS_WARNA_KATEGORI,
  LS_WARNA_KELAS,
  domainDari,
  matkulTerlihat,
  muatWarnaKategori,
  muatWarnaKelas,
  teksDiAtas,
  urlAman,
  type KategoriTautan,
} from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import { ConfirmModal } from "@/components/confirm";

const KATEGORI: KategoriTautan[] = ["kumpul", "materi", "data", "lainnya"];
const BATAS_AWAL = 8;
const TAMBAH = 12;

export default function TautanPage() {
  const { user, tautan, matkul, addTautan, updateTautan, hapusTautan, notify } = useStore();
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
  const [fGambar, setFGambar] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);
  const [warnaKat, setWarnaKat] = useState<Record<KategoriTautan, string>>(() => muatWarnaKategori());
  const [warnaKelas, setWarnaKelas] = useState(() => muatWarnaKelas());
  const [aturWarna, setAturWarna] = useState(false);
  const [gagalGambar, setGagalGambar] = useState<Set<string>>(new Set());
  const [ubahId, setUbahId] = useState<string | null>(null);

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

  function simpanWarna(nk: Record<KategoriTautan, string>, nkl: string) {
    setWarnaKat(nk);
    setWarnaKelas(nkl);
    try {
      localStorage.setItem(LS_WARNA_KATEGORI, JSON.stringify(nk));
      localStorage.setItem(LS_WARNA_KELAS, nkl);
    } catch {
      /* abaikan */
    }
  }

  function bukaTambah() {
    setFJudul("");
    setFUrl("");
    setFKat("kumpul");
    setFMk("");
    setFDesk("");
    setFGambar("");
    setErr(null);
    setTambahBuka(true);
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const gagal = addTautan({
      matkulId: fMk,
      judul: fJudul,
      url: fUrl,
      kategori: fKat,
      deskripsi: fDesk,
      gambarUrl: fGambar.trim() || undefined,
    });
    if (gagal) {
      setErr(gagal);
      return;
    }
    if (fGambar.trim() && !urlAman(fGambar)) {
      setErr("Link gambar tidak valid — tautan tetap tersimpan tanpa gambar? Kosongkan saja.");
      return;
    }
    setFJudul("");
    setFUrl("");
    setFDesk("");
    setFGambar("");
    setErr(null);
    setTambahBuka(false);
    notify("Tautan tersimpan.");
  }

  function kirimUbah(e: React.FormEvent) {
    e.preventDefault();
    if (!ubahId) return;
    const gagal = updateTautan(ubahId, {
      judul: fJudul,
      url: fUrl,
      kategori: fKat,
      matkulId: fMk,
      deskripsi: fDesk,
      gambarUrl: fGambar.trim() ? fGambar.trim() : null,
    });
    if (gagal) {
      setErr(gagal);
      return;
    }
    setUbahId(null);
    setErr(null);
    setGagalGambar((p) => {
      const n = new Set(p);
      n.delete(ubahId);
      return n;
    });
    notify("Tautan diperbarui.");
  }

  function hakTautan(t: (typeof tautan)[number]) {
    if (!user) return { ubah: false, hapus: false };
    const milikku = t.olehId ? t.olehId === user.id : t.oleh === user.nama;
    const pj = !!t.matkulId && matkul.some((m) => m.id === t.matkulId && (m.pjIds ?? []).includes(user.id));
    const kuasanya = milikku || user.role === "admin" || pj;
    return { ubah: kuasanya, hapus: kuasanya };
  }

  function bukaUbah(t: (typeof tautan)[number]) {
    setFJudul(t.judul);
    setFUrl(t.url);
    setFKat(t.kategori);
    setFMk(t.matkulId);
    setFDesk(t.deskripsi);
    setFGambar(t.gambarUrl ?? "");
    setErr(null);
    setUbahId(t.id);
  }

  return (
    <Shell>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-3 sm:gap-y-2">
        <div className="min-w-0 flex-1">
          <SectionTitle
            no={<Link2 size={22} />}
            title="Tautan Penting"
            desc="Semua anak boleh menambah. Milik sendiri bisa diubah/dihapus; milik orang lain hanya admin/PJ."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAturWarna((v) => !v)}
            title="Atur warna jenis"
            className="btn-hard flex items-center justify-center gap-1.5 rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest sm:mt-1 sm:py-2.5"
          >
            <Palette size={15} /> Warna
          </button>
          <button
            onClick={bukaTambah}
            className="btn-hard flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-daun) px-4 py-3 text-[13px] font-extrabold uppercase tracking-widest text-white sm:mt-1 sm:flex-none sm:px-5 sm:py-2.5"
          >
            <Plus size={15} strokeWidth={3} /> Tambah
          </button>
        </div>
      </div>

      {aturWarna && (
        <div className="paper-card mb-3 p-4">
          <p className="text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
            Warna tiap jenis + milik kelas
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {KATEGORI.map((k) => (
              <label key={k} className="flex items-center gap-2 rounded-2xl bg-(--color-cream) px-3 py-2 text-[14px] font-extrabold">
                <input
                  type="color"
                  value={warnaKat[k]}
                  onChange={(e) => simpanWarna({ ...warnaKat, [k]: e.target.value }, warnaKelas)}
                  className="h-8 w-10 cursor-pointer rounded-lg border-2 border-(--color-line) bg-transparent p-0.5"
                />
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: warnaKat[k], color: teksDiAtas(warnaKat[k]) }}>
                  {LABEL_KATEGORI[k]}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 rounded-2xl bg-(--color-cream) px-3 py-2 text-[14px] font-extrabold">
              <input
                type="color"
                value={warnaKelas}
                onChange={(e) => simpanWarna(warnaKat, e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-lg border-2 border-(--color-line) bg-transparent p-0.5"
              />
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: warnaKelas, color: teksDiAtas(warnaKelas) }}>
                Milik kelas
              </span>
            </label>
          </div>
          <p className="mt-2 text-[12px] font-bold text-(--color-faint)">
            Tersimpan di HP ini saja — biar tiap anak bebas mengatur tampilannya.
          </p>
        </div>
      )}

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
          const wKat = warnaKat[t.kategori];
          const wRuang = m ? m.warna : warnaKelas;
          const gbr = t.gambarUrl && !gagalGambar.has(t.id) ? t.gambarUrl : null;
          return (
            <article key={t.id} className="paper-card flex items-start gap-3 overflow-hidden p-4">
              {gbr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gbr}
                  alt=""
                  onError={() => setGagalGambar((p) => new Set(p).add(t.id))}
                  className="h-12 w-12 shrink-0 rounded-2xl border-2 border-(--color-line) object-cover"
                />
              ) : (
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${wKat}22`, color: wKat }}
                >
                  <Link2 size={20} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
                    style={{ background: wKat, color: teksDiAtas(wKat) }}
                  >
                    {LABEL_KATEGORI[t.kategori]}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
                    style={{ background: `${wRuang}22`, color: "var(--color-ink)" }}
                  >
                    <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: wRuang }} />
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
              {(hakTautan(t).ubah || hakTautan(t).hapus) && (
                <span className="flex shrink-0 gap-1.5">
                  {hakTautan(t).ubah && (
                    <button
                      onClick={() => bukaUbah(t)}
                      title="Ubah tautan"
                      className="rounded-xl border-2 border-(--color-line) p-2 text-(--color-soft) hover:bg-(--color-lemon-soft)"
                    >
                      <PencilLine size={15} />
                    </button>
                  )}
                  {hakTautan(t).hapus && (
                    <button
                      onClick={() => setTanyaId(t.id)}
                      title="Hapus tautan"
                      className="rounded-xl border-2 border-(--color-line) p-2 text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </span>
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
            className="paper-card m-auto w-full max-w-lg !rounded-3xl p-5 md:p-6"
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
            <label className="field mt-2 flex items-center gap-2 px-4 py-2.5 text-[15px] outline-none">
              <ImagePlus size={17} className="shrink-0 text-(--color-faint)" />
              <input
                value={fGambar}
                onChange={(e) => setFGambar(e.target.value)}
                placeholder="Link gambar/cover (opsional, mis. https://…/logo.png)"
                inputMode="url"
                className="w-full bg-transparent outline-none"
              />
            </label>
            {fGambar.trim() && urlAman(fGambar) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlAman(fGambar)!} alt="Pratinjau" className="mt-2 h-20 w-20 rounded-2xl border-2 border-(--color-line) object-cover" />
            )}
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

      {ubahId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={() => setUbahId(null)}>
          <form
            onSubmit={kirimUbah}
            onClick={(e) => e.stopPropagation()}
            className="paper-card m-auto w-full max-w-lg !rounded-3xl p-5 md:p-6"
          >
            <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
              <PencilLine size={20} /> Ubah tautan
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
              Perubahan berlaku untuk semua akun. Kosongkan gambar untuk kembali ke ikon.
            </p>
            <input
              value={fJudul}
              onChange={(e) => setFJudul(e.target.value)}
              placeholder="Judul"
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
            <label className="field mt-2 flex items-center gap-2 px-4 py-2.5 text-[15px] outline-none">
              <ImagePlus size={17} className="shrink-0 text-(--color-faint)" />
              <input
                value={fGambar}
                onChange={(e) => setFGambar(e.target.value)}
                placeholder="Link gambar/cover (kosongkan = ikon)"
                inputMode="url"
                className="w-full bg-transparent outline-none"
              />
            </label>
            {fGambar.trim() && urlAman(fGambar) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlAman(fGambar)!} alt="Pratinjau" className="mt-2 h-20 w-20 rounded-2xl border-2 border-(--color-line) object-cover" />
            )}
            {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setUbahId(null)}
                className="rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold text-(--color-soft) hover:bg-(--color-cream)"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-hard rounded-full bg-(--color-ink) px-4 py-2.5 text-[14px] font-extrabold text-[#fff6e8] dark:text-[#181222]"
              >
                Simpan perubahan
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
          if (tanyaId) {
            hapusTautan(tanyaId);
            notify("Tautan dihapus.", "gagal");
          }
          setTanyaId(null);
        }}
      />
    </Shell>
  );
}
