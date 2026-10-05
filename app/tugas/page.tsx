"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Megaphone, Trash2 } from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat, type Catatan } from "@/lib/data";
import { Shell } from "@/components/shell";
import { TugasRow } from "@/components/tugas-row";
import { SectionTitle } from "@/components/bits";
import { ConfirmModal } from "@/components/confirm";

export default function TugasPage() {
  const { tugas, matkul, catatan, addUsulan, user } = useStore();
  const [filterMk, setFilterMk] = useState("semua");
  const [mk, setMk] = useState("");
  const [isi, setIsi] = useState("");

  const matkulSaya = matkul.filter((m) => matkulTerlihat(m, user));
  const matkulId = mk || matkulSaya[0]?.id || "";

  const cocokMk = (matkulId: string) => filterMk === "semua" || matkulId === filterMk;
  const terlihat = tugasTerlihat(tugas, matkul, user).filter(
    (t) => !t.arsip && cocokMk(t.matkulId)
  );
  const usulan = catatan
    .filter((c) => !c.tugasId)
    .filter((c) => matkulSaya.some((m) => m.id === c.matkulId) && cocokMk(c.matkulId));
  const resmi = terlihat.filter(
    (t) => t.status === "resmi" && !sudahSelesai(t, user?.id)
  );
  const selesai = terlihat.filter((t) => sudahSelesai(t, user?.id));

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim() || !matkulId) return;
    addUsulan(matkulId, isi.trim());
    setIsi("");
  }

  return (
    <Shell>
      <SectionTitle
        no="✎"
        title="Papan Tugas"
        desc="Usulan = info mentah dari siapa pun. Yang menjadi tugas resmi hanya yang disimpulkan PJ di halaman RPS."
      />

      <div className="mb-4 flex gap-2">
        <select
          value={filterMk}
          onChange={(e) => setFilterMk(e.target.value)}
          className="field cursor-pointer px-4 py-2.5 text-[15px] font-bold"
          title="Saring berdasarkan matkul"
        >
          <option value="semua">Semua matkul</option>
          {matkulSaya.map((m) => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
      </div>

      {/* Usulan */}
      <section className="mb-6">
        <h3 className="font-display mb-2.5 text-[22px] font-bold">
          Usulan <span className="tnum text-[15px] text-(--color-faint)">({usulan.length})</span>
        </h3>
        <div className="flex flex-col gap-3">
          {usulan.map((c) => (
            <KartuUsulan key={c.id} c={c} />
          ))}
          {!usulan.length && (
            <p className="paper-card p-5 text-[15px] text-(--color-soft)">
              Tidak ada usulan. Denger info tugas? Laporkan lewat form di bawah —
              PJ yang akan menyimpulkannya di halaman RPS.
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

      {/* Lapor usulan */}
      <form onSubmit={kirim} className="paper-card p-4 md:p-5">
        <p className="font-display text-[20px] font-bold">Lapor usulan tugas</p>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          Cukup tulis infonya saja — tanpa deadline, tanpa prioritas. Nanti PJ yang
          menyimpulkan jadi tugas resmi di halaman RPS.
        </p>
        <div className="mt-2.5 grid gap-2 md:grid-cols-3">
          <select value={matkulId} onChange={(e) => setMk(e.target.value)} className="field px-4 py-2.5 text-[15px] font-semibold outline-none">
            {matkulSaya.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
          <input
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder="Denger info tugas apa? Tulis di sini…"
            className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2"
            required
          />
        </div>
        <button type="submit" className="btn-hard mt-2.5 rounded-full bg-(--color-ink) px-6 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
          Kirim usulan
        </button>
      </form>
    </Shell>
  );
}

function KartuUsulan({ c }: { c: Catatan }) {
  const { user, matkulById, bisaSimpulkan, hapusCatatan } = useStore();
  const [tanya, setTanya] = useState(false);
  const m = matkulById(c.matkulId);
  const milikku = user && c.oleh === user.nama;
  const bolehHapus =
    !!milikku || user?.role === "admin" || (user ? bisaSimpulkan(c.matkulId) : false);

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
        </div>
        <p className="mt-1.5 text-[16px] font-bold leading-snug">{c.isi}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-(--color-soft)">
          dari {c.oleh}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {m && (
            <Link
              href={`/matkul/${m.id}`}
              className="flex items-center gap-1 rounded-full bg-(--color-ink) px-4 py-2 text-[13px] font-extrabold text-[#fff6e8] dark:text-[#181222]"
            >
              Proses di RPS <ArrowRight size={14} strokeWidth={3} />
            </Link>
          )}
          {bolehHapus && (
            <button
              onClick={() => setTanya(true)}
              className="flex items-center gap-1.5 rounded-full border-2 border-(--color-line) px-4 py-2 text-[13px] font-extrabold text-(--color-soft) hover:bg-(--color-apel-soft) hover:text-(--color-apel)"
            >
              <Trash2 size={14} /> Hapus
            </button>
          )}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-(--color-faint)">
          <Megaphone size={13} />
          Usulan ini akan disimpulkan PJ menjadi tugas resmi di halaman RPS.
        </p>
      </div>

      <ConfirmModal
        open={tanya}
        bahaya
        judul="Hapus usulan ini?"
        pesan={`"${c.isi.slice(0, 80)}" akan dihapus. Usulan yang dihapus tidak masuk arsip.`}
        batalLabel="Batal"
        yaLabel="Ya, hapus"
        onBatal={() => setTanya(false)}
        onYa={() => {
          hapusCatatan(c.id);
          setTanya(false);
        }}
      />
    </>
  );
}
