"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Archive, CalendarHeart, ExternalLink, Link2, MapPin, Megaphone, PencilLine, Plus, ScrollText, Stamp, Trash2, UserRound } from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { LABEL_KATEGORI, domainDari, matkulTerlihat, subtaskSelesai, type KategoriTautan } from "@/lib/data";
import { Shell } from "@/components/shell";
import { SksCap, fmtTanggal, PertemuanCap, PrioritasCap } from "@/components/bits";
import { ModalUbahMatkul } from "@/components/matkul-form";
import { ConfirmModal } from "@/components/confirm";
import type { Prioritas } from "@/lib/data";

export default function MatkulDetail() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { matkulById, tugas, catatan, addCatatan, finalizeTugas, toggleSelesai, toggleSubtask, user, users, bisaSimpulkan, arsipkan, hapusTugas } =
    useStore();

  const [isi, setIsi] = useState("");
  const [tanyaId, setTanyaId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [ubahMk, setUbahMk] = useState(false);
  const [fJudul, setFJudul] = useState("");
  const [fDesk, setFDesk] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [fPrioritas, setFPrioritas] = useState<Prioritas>("sedang");
  const [fPertemuan, setFPertemuan] = useState("");
  const [fPilih, setFPilih] = useState<string[]>([]);

  const m = matkulById(id);
  if (!m)
    return (
      <Shell>
        <p className="paper-card p-6 text-[15px]">
          Matkul tidak ditemukan. <Link href="/matkul" className="font-bold underline">Kembali</Link>
        </p>
      </Shell>
    );

  const ikut = user ? matkulTerlihat(m, user) : false;
  if (!ikut)
    return (
      <Shell>
        <div className="paper-card p-6 text-center">
          <p className="font-display text-[24px] font-bold">Kamu tidak mengambil matkul ini</p>
          <p className="mt-1 text-[15px] text-(--color-soft)">
            {m.nama} hanya untuk peserta terdaftar. Hubungi admin bila seharusnya kamu ikut.
          </p>
          <Link href="/matkul" className="btn-hard mt-4 inline-block rounded-full bg-(--color-ink) px-6 py-2.5 text-[14px] font-extrabold text-[#fff6e8] dark:text-[#181222]">
            Kembali ke daftar
          </Link>
        </div>
      </Shell>
    );

  const tgs = tugas.filter((t) => t.matkulId === m.id);
  const aktif = tgs.filter((t) => !t.arsip);
  const ctt = catatan.filter((c) => c.matkulId === m.id);
  const bebas = ctt.filter((c) => !c.tugasId);
  const bolehSimpulkan = bisaSimpulkan(m.id);
  const daftarPj = (m.pjIds ?? [])
    .map((id) => users.find((u) => u.id === id)?.nama)
    .filter(Boolean);

  function kirimCatatan(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim()) return;
    addCatatan(m!.id, isi.trim());
    setIsi("");
  }

  function simpulkan(e: React.FormEvent) {
    e.preventDefault();
    if (!fJudul.trim() || !fDeadline) return;
    const n = parseInt(fPertemuan, 10);
    finalizeTugas({
      matkulId: m!.id,
      judul: fJudul.trim(),
      deskripsi: fDesk.trim() || "—",
      deadline: fDeadline,
      prioritas: fPrioritas,
      pertemuan: Number.isNaN(n) ? undefined : n,
      catatanIds: fPilih,
    });
    setFJudul(""); setFDesk(""); setFDeadline(""); setFPertemuan(""); setFPilih([]);
  }

  return (
    <Shell>
      <Link href="/matkul" className="flex w-fit items-center gap-1.5 rounded-full bg-(--color-card) px-4 py-2 text-[13px] font-extrabold text-(--color-soft) hover:text-(--color-ink)">
        <ArrowLeft size={15} strokeWidth={3} /> SEMUA MATKUL
      </Link>

      {/* Kepala */}
      <header className="paper-card mt-3 overflow-hidden">
        <div className="px-5 pb-5 pt-5 md:px-6" style={{ background: `${m.warna}20` }}>
          <span className="tape block h-5 w-24" style={{ background: `${m.warna}55` }} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg px-2 py-0.5 text-[12px] font-extrabold text-white" style={{ background: m.warna }}>
              {m.kode}
            </span>
            <SksCap sks={m.sks} />
            <span className="text-[13px] font-bold text-(--color-soft)">Semester {m.semester} · {m.kelompok}</span>
          </div>
          <h1 className="font-display mt-2 text-[32px] font-bold leading-tight md:text-[38px]">{m.nama}</h1>
          <div className="mt-3 grid gap-2 text-[15px] font-medium md:grid-cols-3">
            <p className="flex items-center gap-1.5"><UserRound size={16} className="shrink-0" /> {m.dosen.join(" · ")}</p>
            <div className="flex flex-col gap-1">
              {m.jadwal.map((j, i) => (
                <p key={i} className="flex items-center gap-1.5"><CalendarHeart size={16} className="shrink-0" /> {j.hari}, {j.jam}</p>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {m.jadwal.map((j, i) => (
                <p key={i} className="flex items-center gap-1.5"><MapPin size={16} className="shrink-0" /> {j.ruang}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 px-5 py-4 md:px-6">
          <ScrollText size={18} className="mt-0.5 shrink-0 text-(--color-lemon)" />
          <div>
            <p className="text-[15px] leading-relaxed"><b>Kontrak kuliah — </b><span className="text-(--color-soft)">{m.kontrak}</span></p>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] font-bold">
              <span>
                PJ matkul:{" "}
                {daftarPj.length > 0 ? (
                  <span className="text-(--color-apel)">{daftarPj.join(", ")}</span>
                ) : (
                  <span className="text-(--color-faint)">belum ditunjuk (sementara admin)</span>
                )}
              </span>
              {bolehSimpulkan && (
                <button
                  onClick={() => setUbahMk(true)}
                  className="flex items-center gap-1 rounded-full border-2 border-(--color-line) bg-(--color-card) px-3 py-1 text-[12px] font-extrabold hover:bg-(--color-lemon-soft)"
                >
                  <PencilLine size={13} /> Ubah info & kontrak
                </button>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-6">
        {/* Tugas resmi */}
        <section>
          <h2 className="font-display mb-3 text-[24px] font-bold">
            Tugas resmi <span className="tnum text-[16px] text-(--color-faint)">({aktif.filter(t=>t.status!=="usulan").length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {aktif.filter(t=>t.status!=="usulan").map((t) => {
              const doneSaya = sudahSelesai(t, user?.id);
              const jml = (t.selesaiOleh ?? []).length;
              return (
              <article key={t.id} className={`paper-card p-4 md:p-5 ${doneSaya ? "opacity-75" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <PrioritasCap p={t.prioritas} />
                  <PertemuanCap n={t.pertemuan} />
                  <span className="rounded-full bg-(--color-cream) px-2.5 py-0.5 text-[12px] font-extrabold text-(--color-soft)">
                    {fmtTanggal(t.deadline)}
                  </span>
                  {doneSaya && (
                    <span className="sticker bg-(--color-daun-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-daun)">
                      Selesai olehmu!
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (doneSaya) toggleSelesai(t.id);
                      else setTanyaId(t.id);
                    }}
                    className="ml-auto rounded-full border-2 border-(--color-line) px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest hover:bg-(--color-cream)"
                  >
                    {doneSaya ? "Batalkan" : "Selesai!"}
                  </button>
                </div>
                <h3 className={`mt-2 text-[17px] font-extrabold leading-snug ${doneSaya?"line-through opacity-70":""}`}>{t.judul}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-(--color-soft)">{t.deskripsi}</p>
                {t.subtask.length > 0 && (
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {t.subtask.map((s, i) => {
                      const centang = subtaskSelesai(s, user?.id);
                      return (
                      <li key={i}>
                        <button onClick={() => toggleSubtask(t.id, i)} className="flex items-center gap-2 text-[14px] font-medium">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-[2.5px] text-[12px] font-black text-white ${centang ? "border-(--color-daun) bg-(--color-daun)" : "border-(--color-faint)"}`}>
                            {centang && "✓"}
                          </span>
                          <span className={centang ? "line-through opacity-60" : ""}>{s.label}</span>
                        </button>
                      </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-2.5 text-[12px] font-bold uppercase tracking-widest text-(--color-faint)">
                  Disimpulkan oleh {t.disimpulkanOleh ?? t.dibuatOleh}
                  {jml > 0 && <span> · {jml} dari {users.length} sudah selesai</span>}
                </p>
                {bolehSimpulkan && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => setEditId(t.id)}
                      className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) px-3 py-1.5 text-[12px] font-extrabold hover:bg-(--color-lemon-soft)"
                    >
                      <PencilLine size={14} /> Ubah
                    </button>
                    <button
                      onClick={() => arsipkan(t.id, true)}
                      className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-(--color-line) px-3 py-1.5 text-[12px] font-extrabold text-(--color-soft) hover:border-(--color-anggur) hover:text-(--color-anggur)"
                    >
                      <Archive size={14} /> Arsipkan
                    </button>
                    <button
                      onClick={() => setHapusId(t.id)}
                      className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) px-3 py-1.5 text-[12px] font-extrabold text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                )}
              </article>
              );
            })}
            {!aktif.filter(t=>t.status!=="usulan").length && (
              <p className="paper-card p-5 text-[15px] text-(--color-soft)">Belum ada tugas resmi di matkul ini.</p>
            )}
          </div>
        </section>

        {/* Catatan + finalisasi */}
        <section>
          <h2 className="font-display mb-3 text-[24px] font-bold">Catatan kelas</h2>
          <form onSubmit={kirimCatatan} className="field flex gap-2 p-2 pl-4">
            <input
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Denger info tugas? Tulis di sini…"
              className="w-full bg-transparent py-2 text-[15px] outline-none"
            />
            <button type="submit" className="btn-hard shrink-0 rounded-xl bg-(--color-ink) px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
              Catat
            </button>
          </form>
          <div className="mt-3 flex flex-col gap-2.5">
            {bebas.map((c) => (
              <div key={c.id} className="paper-card flex items-start gap-2.5 !rounded-2xl p-4">
                <Megaphone size={17} className="mt-0.5 shrink-0 text-(--color-lemon)" />
                <div>
                  <p className="text-[15px] leading-relaxed">{c.isi}</p>
                  <p className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">oleh {c.oleh}</p>
                </div>
              </div>
            ))}
            {!bebas.length && <p className="text-[14px] font-medium text-(--color-faint)">Belum ada catatan lepas. Jadilah yang pertama melapor!</p>}
          </div>

          {bolehSimpulkan ? (
            <form onSubmit={simpulkan} className="paper-card mt-4 !border-(--color-ink) p-5">
              <h3 className="font-display flex items-center gap-2 text-[19px] font-bold">
                <Stamp size={18} /> Simpulkan jadi tugas resmi
              </h3>
              <input value={fJudul} onChange={(e)=>setFJudul(e.target.value)} placeholder="Judul final tugas…" className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none" required />
              <textarea value={fDesk} onChange={(e)=>setFDesk(e.target.value)} placeholder="Rincian sedetail mungkin: apa, berapa, format, cara kumpul…" rows={3} className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none" />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="text-[13px] font-extrabold">Tanggal kumpul
                  <input type="date" value={fDeadline} onChange={(e)=>setFDeadline(e.target.value)} className="field mt-1 w-full px-4 py-2.5 text-[15px] outline-none" required />
                </label>
                <label className="text-[13px] font-extrabold">Prioritas
                  <select value={fPrioritas} onChange={(e)=>setFPrioritas(e.target.value as Prioritas)} className="field mt-1 w-full px-4 py-2.5 text-[15px] outline-none">
                    <option value="rendah">Santai</option>
                    <option value="sedang">Sedang</option>
                    <option value="mendesak">Mendesak!</option>
                  </select>
                </label>
                <label className="text-[13px] font-extrabold">Pertemuan
                  <input type="number" min={1} max={16} value={fPertemuan} onChange={(e)=>setFPertemuan(e.target.value)} placeholder="ke-?" title="Pertemuan ke berapa (opsional, untuk arsip)" className="field mt-1 w-full px-4 py-2.5 text-[15px] outline-none" />
                </label>
              </div>
              {bebas.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <p className="text-[12px] font-extrabold uppercase tracking-widest text-(--color-faint)">Gabungkan catatan:</p>
                  {bebas.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-start gap-2 text-[14px] font-medium">
                      <input type="checkbox" checked={fPilih.includes(c.id)} onChange={()=>setFPilih(p=>p.includes(c.id)?p.filter(x=>x!==c.id):[...p,c.id])} className="mt-1 h-4 w-4 accent-[#e8552f]" />
                      <span className="line-clamp-1">{c.isi}</span>
                    </label>
                  ))}
                </div>
              )}
              <button type="submit" className="btn-hard font-display mt-3.5 w-full rounded-full bg-(--color-daun) px-4 py-3 text-[17px] font-bold text-white">
                Terbitkan tugas resmi
              </button>
            </form>
          ) : (
            <p className="mt-4 rounded-2xl bg-(--color-cream) p-4 text-[13px] font-medium leading-relaxed text-(--color-soft)">
              Hanya admin / PJ matkul ini yang bisa menyimpulkan catatan jadi tugas resmi.
              {daftarPj.length > 0 && <> PJ {m.nama}: <b>{daftarPj.join(", ")}</b>.</>} Kamu cukup
              rajin melapor lewat catatan di atas!
            </p>
          )}
        </section>

        {/* Tautan penting matkul ini */}
        <SeksiTautan matkulId={m!.id} />
      </div>

      <ConfirmModal
        open={tanyaId !== null}
        judul="Tugasnya sudah beres?"
        pesan={(() => {
          const t = tgs.find((x) => x.id === tanyaId);
          return t
            ? `"${t.judul}" akan ditandai selesai di akunmu. Pastikan sudah dikumpulkan ya! Teman lain tidak ikut terpengaruh.`
            : "";
        })()}
        onBatal={() => setTanyaId(null)}
        onYa={() => {
          if (tanyaId) toggleSelesai(tanyaId);
          setTanyaId(null);
        }}
      />

      <ConfirmModal
        open={hapusId !== null}
        bahaya
        judul="Hapus tugas ini?"
        pesan={(() => {
          const t = tgs.find((x) => x.id === hapusId);
          return t
            ? `"${t.judul}" akan hilang permanen dari semua akun dan tidak masuk arsip. Yakin?`
            : "";
        })()}
        batalLabel="Batal"
        yaLabel="Ya, hapus"
        onBatal={() => setHapusId(null)}
        onYa={() => {
          if (hapusId) hapusTugas(hapusId);
          setHapusId(null);
        }}
      />

      {editId && (
        <ModalUbah
          tugasId={editId}
          onTutup={() => setEditId(null)}
        />
      )}

      {ubahMk && (
        <ModalUbahMatkul
          matkulId={m.id}
          onTutup={() => setUbahMk(false)}
        />
      )}
    </Shell>
  );
}

function SeksiTautan({ matkulId }: { matkulId: string }) {
  const { user, matkul, tautan, addTautan, hapusTautan } = useStore();
  const [buka, setBuka] = useState(false);
  const [batas, setBatas] = useState(4);
  const [judul, setJudul] = useState("");
  const [url, setUrl] = useState("");
  const [kat, setKat] = useState<KategoriTautan>("kumpul");
  const [desk, setDesk] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);

  const daftar = tautan.filter((t) => t.matkulId === matkulId);
  const tampil = daftar.slice(0, batas);
  const sisa = daftar.length - tampil.length;

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const gagal = addTautan({ matkulId, judul, url, kategori: kat, deskripsi: desk });
    if (gagal) {
      setErr(gagal);
      return;
    }
    setJudul("");
    setUrl("");
    setDesk("");
    setErr(null);
    setBuka(false);
  }

  function bolehHapus(t: import("@/lib/data").Tautan) {
    if (!user) return false;
    if (t.olehId ? t.olehId === user.id : t.oleh === user.nama) return true;
    if (user.role === "admin") return true;
    return matkul.some((mm) => mm.id === matkulId && (mm.pjIds ?? []).includes(user.id));
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display flex items-center gap-2 text-[24px] font-bold">
          <Link2 size={22} /> Tautan penting
          <span className="tnum text-[16px] text-(--color-faint)">({daftar.length})</span>
        </h2>
        <button
          onClick={() => {
            setErr(null);
            setBuka(true);
          }}
          className="btn-hard flex shrink-0 items-center gap-1.5 rounded-full bg-(--color-daun) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-white"
        >
          <Plus size={14} strokeWidth={3} /> Tambah
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {tampil.map((t) => (
          <div key={t.id} className="paper-card flex items-start gap-2.5 !rounded-2xl p-4">
            <Link2 size={17} className="mt-0.5 shrink-0 text-(--color-daun)" />
            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-(--color-daun-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-daun)">
                {LABEL_KATEGORI[t.kategori]} · {domainDari(t.url)}
              </span>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-[16px] font-extrabold leading-snug hover:underline"
              >
                {t.judul}
                <ExternalLink size={14} className="shrink-0" />
              </a>
              {t.deskripsi && <p className="mt-0.5 line-clamp-2 text-[14px] text-(--color-soft)">{t.deskripsi}</p>}
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
          </div>
        ))}
        {!daftar.length && (
          <p className="text-[14px] font-medium text-(--color-faint)">
            Belum ada tautan di matkul ini. Tambahkan link kumpul GDrive / materi pertama!
          </p>
        )}
      </div>
      {sisa > 0 && (
        <button
          onClick={() => setBatas((b) => b + 6)}
          className="mt-3 w-full rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[13px] font-extrabold hover:bg-(--color-cream)"
        >
          Muat {Math.min(sisa, 6)} lagi ({sisa} tersisa)
        </button>
      )}
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={() => setBuka(false)}>
          <form
            onSubmit={kirim}
            onClick={(e) => e.stopPropagation()}
            className="paper-card my-8 w-full max-w-md !rounded-3xl p-5 md:p-6"
          >
            <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
              <Plus size={20} /> Tambah tautan
            </h3>
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Judul, mis. Kumpul Tugas GDrive"
              className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none"
              required
              maxLength={120}
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
              className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none"
              required
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={kat} onChange={(e) => setKat(e.target.value as KategoriTautan)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
                <option value="kumpul">Link kumpul</option>
                <option value="materi">Materi</option>
                <option value="data">Data kelas</option>
                <option value="lainnya">Lainnya</option>
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
              <button
                type="submit"
                className="btn-hard rounded-full bg-(--color-daun) px-4 py-2.5 text-[14px] font-extrabold text-white"
              >
                Simpan
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
    </section>
  );
}

function ModalUbah({ tugasId, onTutup }: { tugasId: string; onTutup: () => void }) {
  const { tugas, updateTugas } = useStore();
  const t = tugas.find((x) => x.id === tugasId);
  const awal = {
    judul: t?.judul ?? "",
    deskripsi: t?.deskripsi ?? "",
    deadline: t?.deadline ?? new Date().toISOString(),
    prioritas: t?.prioritas ?? ("sedang" as Prioritas),
    pertemuan: t?.pertemuan,
  };
  const [judul, setJudul] = useState(awal.judul);
  const [deskripsi, setDeskripsi] = useState(awal.deskripsi);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(awal.deadline);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const [prioritas, setPrioritas] = useState<Prioritas>(awal.prioritas);
  const [pertemuan, setPertemuan] = useState(awal.pertemuan ? String(awal.pertemuan) : "");

  if (!t) return null;
  const idTugas = t.id;

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !deadline) return;
    const n = parseInt(pertemuan, 10);
    updateTugas(idTugas, {
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || "—",
      deadline,
      prioritas,
      pertemuan: Number.isNaN(n) ? undefined : n,
    });
    onTutup();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onTutup}>
      <form
        onSubmit={simpan}
        onClick={(e) => e.stopPropagation()}
        className="paper-card w-full max-w-md !rounded-3xl p-5 md:p-6"
      >
        <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
          <PencilLine size={20} /> Ubah tugas
        </h3>
        <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
          Perubahan berlaku untuk semua peserta matkul ini.
        </p>
        <input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder="Judul tugas…"
          className="field mt-3 w-full px-4 py-2.5 text-[15px] outline-none"
          required
        />
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={3}
          placeholder="Rincian…"
          className="field mt-2 w-full px-4 py-2.5 text-[15px] outline-none"
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="text-[12px] font-extrabold">Tanggal
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="field mt-1 w-full px-3 py-2 text-[14px] outline-none" required />
          </label>
          <label className="text-[12px] font-extrabold">Prioritas
            <select value={prioritas} onChange={(e) => setPrioritas(e.target.value as Prioritas)} className="field mt-1 w-full px-3 py-2 text-[14px] outline-none">
              <option value="rendah">Santai</option>
              <option value="sedang">Sedang</option>
              <option value="mendesak">Mendesak!</option>
            </select>
          </label>
          <label className="text-[12px] font-extrabold">Pertemuan
            <input type="number" min={1} max={16} value={pertemuan} onChange={(e) => setPertemuan(e.target.value)} placeholder="ke-?" className="field mt-1 w-full px-3 py-2 text-[14px] outline-none" />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onTutup}
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
  );
}
