"use client";

import { useState } from "react";
import { BookPlus, PencilLine, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { HARI_ORDER, PALET_WARNA, teksDiAtas, type Jadwal } from "@/lib/data";

/** Ubah info matkul + kontrak + jadwal. Hanya dipanggil bila bolehSimpulkan. */
export function ModalUbahMatkul({ matkulId, onTutup }: { matkulId: string; onTutup: () => void }) {
  const { matkulById, updateMatkul, user } = useStore();
  const m = matkulById(matkulId);
  const adminSaja = user?.role === "admin";

  const [nama, setNama] = useState(m?.nama ?? "");
  const [kode, setKode] = useState(m?.kode ?? "");
  const [dosen, setDosen] = useState((m?.dosen ?? []).join(", "));
  const [sks, setSks] = useState(m?.sks ?? 2);
  const [semester, setSemester] = useState(m?.semester ?? 1);
  const [warna, setWarna] = useState(m?.warna ?? PALET_WARNA[0]);
  const [kelompok, setKelompok] = useState(m?.kelompok ?? "B – B");
  const [kontrak, setKontrak] = useState(m?.kontrak ?? "");
  const [driveUrl, setDriveUrl] = useState(m?.driveUrl ?? "");
  const [jadwal, setJadwal] = useState<Jadwal[]>(
    m?.jadwal?.length ? m.jadwal.map((j) => ({ ...j })) : [{ hari: "Senin", jam: "", ruang: "" }]
  );

  if (!m) return null;
  const idMk = m.id;

  function ubahSesi(i: number, patch: Partial<Jadwal>) {
    setJadwal((p) => p.map((j, x) => (x === i ? { ...j, ...patch } : j)));
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || !kode.trim()) return;
    const drive = driveUrl.trim();
    updateMatkul(idMk, {
      nama: nama.trim(),
      kode: kode.trim().toUpperCase(),
      dosen: dosen.split(",").map((s) => s.trim()).filter(Boolean),
      sks: Math.max(1, Math.min(12, sks || 2)),
      semester: adminSaja ? Math.max(1, Math.min(14, semester || 1)) : (m?.semester ?? 1),
      warna: adminSaja ? warna : (m?.warna ?? warna),
      kelompok: kelompok.trim() || "B – B",
      kontrak: kontrak.trim(),
      // driveUrl hanya ikut terkirim bila admin — PJ/member tak bisa timpa.
      ...(adminSaja ? { driveUrl: drive.slice(0, 2000) } : {}),
      jadwal: jadwal.filter((j) => j.hari && (j.jam || j.ruang)),
    });
    onTutup();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={onTutup}>
      <form
        onSubmit={simpan}
        onClick={(e) => e.stopPropagation()}
        className="paper-card my-8 w-full max-w-lg !rounded-3xl p-5 md:p-6"
      >
        <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
          <PencilLine size={20} /> Ubah {m.nama}
        </h3>
        <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
          Perubahan berlaku untuk semua peserta dan tercatat di Riwayat.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama matkul" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" required />
          <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Kode" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <input value={sks} onChange={(e) => setSks(Number(e.target.value))} type="number" min={1} max={12} title="SKS" className="field px-4 py-2.5 text-[15px] outline-none" />
          <input value={dosen} onChange={(e) => setDosen(e.target.value)} placeholder="Dosen (koma bila >1)" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" />
          <input value={kelompok} onChange={(e) => setKelompok(e.target.value)} placeholder="Kelompok, mis. B – B" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" />
          {adminSaja && (
            <>
              <label className="field flex items-center gap-2 px-4 py-2.5 text-[15px] font-bold outline-none">
                Semester
                <input value={semester} onChange={(e) => setSemester(Number(e.target.value))} type="number" min={1} max={14} className="w-16 bg-transparent outline-none" />
              </label>
              <div className="field flex items-center gap-2 px-4 py-2 text-[14px] font-bold">
                <input
                  type="color"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                  title="Warna bebas"
                  className="h-8 w-10 cursor-pointer rounded-lg border-2 border-(--color-line) bg-transparent p-0.5"
                />
                <span className="flex flex-1 gap-1">
                  {PALET_WARNA.map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setWarna(w)}
                      title={w}
                      className={`h-6 w-6 rounded-full border-2 ${warna === w ? "border-(--color-ink)" : "border-transparent"}`}
                      style={{ background: w }}
                    />
                  ))}
                </span>
                <span className="rounded-lg px-2 py-0.5 text-[11px] font-extrabold" style={{ background: warna, color: teksDiAtas(warna) }}>
                  {warna}
                </span>
              </div>
              <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="Link folder Drive matkul — khusus admin" inputMode="url" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" />
            </>
          )}
        </div>

        <p className="mt-3 text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
          Jadwal & ruangan
        </p>
        <div className="mt-1.5 flex flex-col gap-2">
          {jadwal.map((j, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-1.5 sm:flex">
              <select value={j.hari} onChange={(e) => ubahSesi(i, { hari: e.target.value })} className="field col-span-3 min-w-0 px-2 py-2 text-[14px] outline-none sm:w-28 sm:flex-none">
                {HARI_ORDER.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <input value={j.jam} onChange={(e) => ubahSesi(i, { jam: e.target.value })} placeholder="07:00 – 09:35" className="field min-w-0 flex-1 px-3 py-2 text-[14px] outline-none" />
              <input value={j.ruang} onChange={(e) => ubahSesi(i, { ruang: e.target.value })} placeholder="Ruang…" className="field min-w-0 flex-1 px-3 py-2 text-[14px] outline-none" />
              <button
                type="button"
                onClick={() => setJadwal((p) => p.filter((_, x) => x !== i))}
                title="Hapus sesi"
                className="shrink-0 rounded-xl border-2 border-(--color-line) p-2 hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setJadwal((p) => [...p, { hari: "Senin", jam: "", ruang: "" }])}
            className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-(--color-line) px-3 py-2 text-[13px] font-extrabold text-(--color-soft) hover:border-(--color-lemon)"
          >
            <Plus size={15} strokeWidth={3} /> Tambah sesi (mis. PAI sesi Sabtu)
          </button>
        </div>

        <p className="mt-3 text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
          Kontrak kuliah
        </p>
        <textarea
          value={kontrak}
          onChange={(e) => setKontrak(e.target.value)}
          rows={4}
          placeholder="Penilaian, kehadiran, tugas…"
          className="field mt-1.5 w-full px-4 py-2.5 text-[15px] outline-none"
        />

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

/** Form tambah matkul lengkap: kode, dosen, sks, semester, warna, jadwal+ruang, kontrak. */
export function ModalTambahMatkul({ onTutup }: { onTutup: () => void }) {
  const { addMatkul, semester: semAktif, notify } = useStore();
  const angkaSem = /(\d+)/.exec(semAktif.label)?.[1];
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [dosen, setDosen] = useState("");
  const [sks, setSks] = useState(2);
  const [sem, setSem] = useState(angkaSem ? parseInt(angkaSem, 10) : 1);
  const [warna, setWarna] = useState(PALET_WARNA[0]);
  const [kelompok, setKelompok] = useState("B – B");
  const [kontrak, setKontrak] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [jadwal, setJadwal] = useState<Jadwal[]>([{ hari: "Senin", jam: "", ruang: "" }]);
  const [err, setErr] = useState<string | null>(null);

  function ubahSesi(i: number, patch: Partial<Jadwal>) {
    setJadwal((p) => p.map((j, x) => (x === i ? { ...j, ...patch } : j)));
  }

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || !kode.trim()) {
      setErr("Nama dan kode matkul wajib diisi.");
      return;
    }
    const sesi = jadwal.filter((j) => j.hari && (j.jam.trim() || j.ruang.trim()));
    if (!sesi.length) {
      setErr("Isi minimal 1 sesi jadwal + jam / ruang.");
      return;
    }
    addMatkul({
      kode: kode.trim().toUpperCase(),
      nama: nama.trim(),
      dosen: dosen.split(",").map((s) => s.trim()).filter(Boolean),
      sks: Math.max(1, Math.min(12, sks || 2)),
      semester: Math.max(1, Math.min(14, sem || 1)),
      kelompok: kelompok.trim() || "B – B",
      jadwal: sesi.map((j) => ({ hari: j.hari, jam: j.jam.trim() || "Menyusul", ruang: j.ruang.trim() || "Menyusul" })),
      warna,
      kontrak: kontrak.trim() || "Kontrak menyusul — admin akan melengkapi.",
      ...(driveUrl.trim() ? { driveUrl: driveUrl.trim().slice(0, 2000) } : {}),
    });
    notify(`Matkul “${nama.trim()}” ditambahkan.`);
    onTutup();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4" onClick={onTutup}>
      <form
        onSubmit={simpan}
        onClick={(e) => e.stopPropagation()}
        className="paper-card my-8 w-full max-w-lg !rounded-3xl p-5 md:p-6"
      >
        <h3 className="font-display flex items-center gap-2 text-[22px] font-bold">
          <BookPlus size={20} /> Tambah matkul
        </h3>
        <p className="mt-0.5 text-[13px] font-medium text-(--color-soft)">
          Lengkap sejak awal: jadwal, ruangan, warna — langsung tampil di kalender.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama matkul" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" required />
          <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Kode, mis. PMDR236099" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <input value={sks} onChange={(e) => setSks(Number(e.target.value))} type="number" min={1} max={12} title="SKS" className="field px-4 py-2.5 text-[15px] outline-none" />
          <input value={dosen} onChange={(e) => setDosen(e.target.value)} placeholder="Dosen (koma bila >1)" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" />
          <input value={kelompok} onChange={(e) => setKelompok(e.target.value)} placeholder="Kelompok, mis. B – B" className="field px-4 py-2.5 text-[15px] outline-none" />
          <label className="field flex items-center gap-2 px-4 py-2.5 text-[15px] font-bold outline-none">
            Semester
            <input value={sem} onChange={(e) => setSem(Number(e.target.value))} type="number" min={1} max={14} className="w-16 bg-transparent outline-none" />
          </label>
          <div className="field flex items-center gap-2 px-4 py-2 text-[14px] font-bold md:col-span-2">
            <input
              type="color"
              value={warna}
              onChange={(e) => setWarna(e.target.value)}
              title="Warna bebas"
              className="h-8 w-10 cursor-pointer rounded-lg border-2 border-(--color-line) bg-transparent p-0.5"
            />
            <span className="flex flex-1 gap-1">
              {PALET_WARNA.map((w) => (
                <button
                  type="button"
                  key={w}
                  onClick={() => setWarna(w)}
                  title={w}
                  className={`h-6 w-6 rounded-full border-2 ${warna === w ? "border-(--color-ink)" : "border-transparent"}`}
                  style={{ background: w }}
                />
              ))}
            </span>
            <span className="rounded-lg px-2 py-0.5 text-[11px] font-extrabold" style={{ background: warna, color: teksDiAtas(warna) }}>
              {warna}
            </span>
          </div>
          <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="Link folder Drive (opsional)" inputMode="url" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" />
        </div>

        <p className="mt-3 text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
          Jadwal & ruangan
        </p>
        <div className="mt-1.5 flex flex-col gap-2">
          {jadwal.map((j, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-1.5 sm:flex">
              <select value={j.hari} onChange={(e) => ubahSesi(i, { hari: e.target.value })} className="field col-span-3 min-w-0 px-2 py-2 text-[14px] outline-none sm:w-28 sm:flex-none">
                {HARI_ORDER.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <input value={j.jam} onChange={(e) => ubahSesi(i, { jam: e.target.value })} placeholder="07:00 – 09:35" className="field min-w-0 flex-1 px-3 py-2 text-[14px] outline-none" />
              <input value={j.ruang} onChange={(e) => ubahSesi(i, { ruang: e.target.value })} placeholder="Ruang…" className="field min-w-0 flex-1 px-3 py-2 text-[14px] outline-none" />
              <button
                type="button"
                onClick={() => setJadwal((p) => p.filter((_, x) => x !== i))}
                title="Hapus sesi"
                className="shrink-0 rounded-xl border-2 border-(--color-line) p-2 hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setJadwal((p) => [...p, { hari: "Senin", jam: "", ruang: "" }])}
            className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-(--color-line) px-3 py-2 text-[13px] font-extrabold text-(--color-soft) hover:border-(--color-lemon)"
          >
            <Plus size={15} strokeWidth={3} /> Tambah sesi
          </button>
        </div>

        <p className="mt-3 text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
          Kontrak kuliah
        </p>
        <textarea
          value={kontrak}
          onChange={(e) => setKontrak(e.target.value)}
          rows={3}
          placeholder="Penilaian, kehadiran, tugas…"
          className="field mt-1.5 w-full px-4 py-2.5 text-[15px] outline-none"
        />
        {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}

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
            className="btn-hard rounded-full bg-(--color-daun) px-4 py-2.5 text-[14px] font-extrabold text-white"
          >
            Tambah matkul
          </button>
        </div>
      </form>
    </div>
  );
}
