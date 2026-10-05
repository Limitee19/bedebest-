"use client";

import { useState } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat, type Tugas } from "@/lib/data";
import { Shell } from "@/components/shell";
import { TugasRow } from "@/components/tugas-row";
import { SectionTitle } from "@/components/bits";
import { ConfirmModal } from "@/components/confirm";
import type { Prioritas } from "@/lib/data";

export default function TugasPage() {
  const { tugas, matkul, addUsulan, user } = useStore();
  const [mk, setMk] = useState("");
  const [judul, setJudul] = useState("");
  const [deadline, setDeadline] = useState("");
  const [prioritas, setPrioritas] = useState<Prioritas>("sedang");
  const [pertemuan, setPertemuan] = useState("");

  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const matkulId = mk || matkulSaya[0]?.id || "";
  const terlihat = tugasTerlihat(tugas, matkul, user).filter((t) => !t.arsip);
  const usulan = terlihat.filter((t) => t.status === "usulan");
  const resmi = terlihat.filter(
    (t) => t.status === "resmi" && !sudahSelesai(t, user?.id)
  );
  const selesai = terlihat.filter((t) => sudahSelesai(t, user?.id));

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !matkulId || !deadline) return;
    const n = parseInt(pertemuan, 10);
    addUsulan({
      matkulId,
      judul: judul.trim(),
      deadline,
      prioritas,
      pertemuan: Number.isNaN(n) ? undefined : n,
    });
    setJudul("");
    setDeadline("");
    setPertemuan("");
  }

  return (
    <Shell>
      <SectionTitle
        no="✎"
        title="Papan Tugas"
        desc="Usulan mentah → tugas resmi → selesai. Tanda selesai hanya tercatat di akunmu."
      />

      {/* Usulan */}
      <section className="mb-6">
        <h3 className="font-display mb-2.5 text-[22px] font-bold">
          Usulan <span className="tnum text-[15px] text-(--color-faint)">({usulan.length})</span>
        </h3>
        <p className="mb-3 text-[14px] font-medium text-(--color-soft)">
          Info mentah menunggu disimpulkan. Usulan tidak ikut diarsip — setelah
          diputuskan (dijadikan resmi / dihapus) antreannya bersih lagi.
        </p>
        <div className="flex flex-col gap-3">
          {usulan.map((t) => (
            <KartuUsulan key={t.id} t={t} />
          ))}
          {!usulan.length && (
            <p className="paper-card p-5 text-[15px] text-(--color-soft)">
              Tidak ada usulan. Denger info tugas? Laporkan lewat form di bawah.
            </p>
          )}
        </div>
      </section>

      {/* Resmi */}
      <section className="mb-6">
        <h3 className="font-display mb-2.5 text-[22px] font-bold">
          Resmi <span className="tnum text-[15px] text-(--color-faint)">({resmi.length})</span>
        </h3>
        <div className="flex flex-col gap-3">
          {resmi.map((t) => (
            <TugasRow key={t.id} t={t} />
          ))}
          {!resmi.length && (
            <p className="paper-card p-5 text-[15px] text-(--color-soft)">Papan bersih.</p>
          )}
        </div>
      </section>

      {/* Selesai olehmu */}
      <section className="mb-6">
        <h3 className="font-display mb-2.5 text-[22px] font-bold">
          Selesai olehmu <span className="tnum text-[15px] text-(--color-faint)">({selesai.length})</span>
        </h3>
        <div className="flex flex-col gap-3">
          {selesai.map((t) => (
            <TugasRow key={t.id} t={t} />
          ))}
          {!selesai.length && (
            <p className="paper-card p-5 text-[15px] text-(--color-soft)">
              Belum ada yang selesai. Klik lingkaran untuk menandai.
            </p>
          )}
        </div>
      </section>

      {/* Tambah usulan cepat */}
      <form onSubmit={kirim} className="paper-card p-4 md:p-5">
        <p className="font-display text-[20px] font-bold">Lapor usulan tugas cepat</p>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          Masuk antrean usulan, biar PJ menyimpulkan di halaman matkul.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <select value={matkulId} onChange={(e) => setMk(e.target.value)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
            {matkulSaya.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Denger ada tugas apa?…" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} title="Tanggal kumpul" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <div className="flex gap-2">
            <select value={prioritas} onChange={(e) => setPrioritas(e.target.value as Prioritas)} className="field flex-1 px-4 py-2.5 text-[15px] font-semibold outline-none">
              <option value="rendah">Santai</option>
              <option value="sedang">Sedang</option>
              <option value="mendesak">Mendesak!</option>
            </select>
            <input
              value={pertemuan}
              onChange={(e) => setPertemuan(e.target.value)}
              type="number"
              min={1}
              max={16}
              placeholder="Pertemuan?"
              title="Pertemuan ke berapa (opsional)"
              className="field w-32 px-4 py-2.5 text-[15px] outline-none"
            />
          </div>
        </div>
        <button type="submit" className="btn-hard mt-2.5 rounded-full bg-(--color-ink) px-6 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
          Kirim usulan
        </button>
      </form>
    </Shell>
  );
}

function KartuUsulan({ t }: { t: Tugas }) {
  const { user, matkulById, bisaSimpulkan, jadikanResmi, hapusTugas } = useStore();
  const [tanya, setTanya] = useState<null | "resmi" | "hapus">(null);
  const m = matkulById(t.matkulId);
  const boleh = bisaSimpulkan(t.matkulId);
  const milikku = user && t.dibuatOleh === user.nama;

  return (
    <>
      <div className="paper-card border-dashed p-4">
        <div className="flex flex-wrap items-center gap-2">
          {m && (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white" style={{ background: m.warna }}>
              {m.nama}
            </span>
          )}
          <span className="sticker bg-(--color-lemon-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-lemon)">
            Usulan, tunggu PJ
          </span>
          {t.pertemuan ? (
            <span className="rounded-full bg-(--color-sky-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-sky)">
              Pertemuan {t.pertemuan}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 text-[16px] font-bold leading-snug">{t.judul}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-(--color-soft)">
          dari {t.dibuatOleh}
        </p>
        {(boleh || milikku) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {boleh && (
              <button
                onClick={() => setTanya("resmi")}
                className="btn-hard flex items-center gap-1.5 rounded-full bg-(--color-daun) px-4 py-2 text-[13px] font-extrabold text-white"
              >
                <CheckCheck size={15} strokeWidth={3} /> Jadikan resmi
              </button>
            )}
            <button
              onClick={() => setTanya("hapus")}
              className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) px-4 py-2 text-[13px] font-extrabold text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
            >
              <Trash2 size={14} /> {boleh ? "Tolak" : "Batalkan"}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={tanya !== null}
        judul={tanya === "resmi" ? "Jadikan tugas resmi?" : "Hapus usulan ini?"}
        pesan={
          tanya === "resmi"
            ? `"${t.judul}" langsung terbit sebagai tugas resmi berdeadline untuk semua peserta matkul ini.`
            : `"${t.judul}" akan dihapus dari antrean. Usulan yang dihapus tidak masuk arsip.`
        }
        yaLabel={tanya === "resmi" ? "Terbitkan!" : "Ya, hapus"}
        onBatal={() => setTanya(null)}
        onYa={() => {
          if (tanya === "resmi") jadikanResmi(t.id);
          else hapusTugas(t.id);
          setTanya(null);
        }}
      />
    </>
  );
}
