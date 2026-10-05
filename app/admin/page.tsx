"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import { ADMIN_EMAIL, ADMIN_NIM } from "@/lib/data";
import { MatkulCard } from "@/components/matkul-card";

const WARNA = ["#3f8fd1", "#2fa08a", "#e8552f", "#e75d8f", "#7c5cbf", "#e9a13b"];

export default function AdminPage() {
  const { user, users, addUser, removeUser, resetPassword, matkul, addMatkul, removeMatkul, tambahPj, hapusPj, setPeserta } = useStore();
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // form matkul
  const [fNama, setFNama] = useState("");
  const [fKode, setFKode] = useState("");
  const [fDosen, setFDosen] = useState("");
  const [fSks, setFSks] = useState(2);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4">
        <p className="font-mono text-[12px] uppercase tracking-widest text-(--color-faint)">
          Membuka papan…
        </p>
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <Shell>
        <p className="paper-card p-6 text-sm">
          Halaman ini khusus admin / penanggung jawab kelas. Kamu masuk sebagai <b>{user.nama}</b>.
        </p>
      </Shell>
    );
  }

  function tambahUser(e: React.FormEvent) {
    e.preventDefault();
    const er = addUser(nama.trim(), nim.trim());
    if (er) setErr(er);
    else { setNama(""); setNim(""); setErr(null); }
  }

  function tambahMatkul(e: React.FormEvent) {
    e.preventDefault();
    if (!fNama.trim() || !fKode.trim()) return;
    addMatkul({
      kode: fKode.trim().toUpperCase(),
      nama: fNama.trim(),
      dosen: fDosen.split(",").map((s) => s.trim()).filter(Boolean),
      sks: fSks,
      semester: 1,
      kelompok: "B – B",
      jadwal: [{ hari: "Menyusul", jam: "Menyusul", ruang: "Menyusul" }],
      warna: WARNA[matkul.length % WARNA.length],
      kontrak: "Kontrak menyusul — admin akan melengkapi.",
    });
    setFNama(""); setFKode(""); setFDosen(""); setFSks(2);
  }

  return (
    <Shell>
      <SectionTitle no="⚙" title="Kelola Kelas" desc={`${users.length} akun · kata sandi = NIM masing-masing · admin ${ADMIN_NIM}`} />

      {/* Anggota */}
      <section className="paper-card p-4 md:p-6">
        <h3 className="font-display text-[22px] font-bold">Anggota ({users.length})</h3>
        <form onSubmit={tambahUser} className="mt-3 grid gap-2 md:grid-cols-4">
          <input value={nama} onChange={(e)=>setNama(e.target.value)} placeholder="Nama lengkap" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" required />
          <input value={nim} onChange={(e)=>setNim(e.target.value)} inputMode="numeric" placeholder="NIM (jadi kata sandi)" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <button className="btn-hard flex items-center justify-center gap-1.5 rounded-full bg-(--color-ink) px-3 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
            <Plus size={15} strokeWidth={3} /> Buat akun
          </button>
        </form>
        {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
        <div className="mt-4 overflow-x-auto rounded-2xl bg-(--color-cream) p-1">
          <table className="w-full min-w-[620px] text-left text-[14px]">
            <thead>
              <tr className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">NIM</th>
                <th className="px-3 py-2.5">Peran</th>
                <th className="px-3 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[...users].sort((a, b) => a.nama.localeCompare(b.nama, "id")).map((u) => (
                <tr key={u.id} className="border-t-2 border-dashed border-(--color-line) first:border-0">
                  <td className="px-3 py-2.5 font-extrabold">{u.nama}</td>
                  <td className="tnum px-3 py-2.5 text-[13px] font-bold text-(--color-soft)">{u.nim}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest ${u.role === "admin" ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]" : u.role === "pj" ? "bg-(--color-apel) text-white" : "bg-(--color-card) text-(--color-soft)"}`}>
                      {u.role === "admin" ? "Admin" : u.role === "pj" ? "PJ" : "Anggota"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex gap-1.5">
                      <button title="Reset sandi ke NIM" onClick={()=>{ resetPassword(u.id); alert(`Sandi ${u.nama} direset ke NIM-nya (${u.nim})`); }} className="rounded-xl border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-lemon-soft)">
                        <RotateCcw size={15} />
                      </button>
                      {u.email !== ADMIN_EMAIL && (
                        <button title="Hapus" onClick={()=>{ if (confirm(`Hapus ${u.nama}?`)) removeUser(u.id); }} className="rounded-xl border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-apel-soft) hover:text-(--color-apel)">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PJ per matkul */}
      <section className="paper-card mt-5 p-4 md:p-6">
        <h3 className="font-display text-[22px] font-bold">PJ per Mata Kuliah</h3>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          PJ hanya berkuasa di matkulnya: menyimpulkan catatan jadi tugas resmi.
          6 matkul → idealnya 6 orang berbeda, boleh juga rangkap.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {matkul.map((m) => (
            <PjAtur key={m.id} matkulId={m.id} />
          ))}
        </div>
      </section>

      {/* Peserta per matkul — untuk UNIV yang tidak diambil semua anak */}
      <section className="paper-card mt-5 p-4 md:p-6">
        <h3 className="font-display text-[22px] font-bold">Peserta per Mata Kuliah</h3>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          Matkul PMDR wajib seluruh kelas — biarkan "Seluruh kelas". Untuk matkul UNIV,
          centang hanya anak yang mengambilnya. Yang tidak ikut tidak akan melihat
          matkul, tugas, jadwal, maupun notifikasinya.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {matkul.map((m) => (
            <PesertaAtur key={m.id} matkulId={m.id} />
          ))}
        </div>
      </section>

      {/* Matkul */}
      <section className="mt-6">
        <h3 className="font-display mb-3 text-[22px] font-bold">Mata kuliah ({matkul.length})</h3>
        <form onSubmit={tambahMatkul} className="paper-card mb-4 grid gap-2 p-4 md:grid-cols-5">
          <input value={fKode} onChange={(e)=>setFKode(e.target.value)} placeholder="Kode, mis. PMDR236099" className="field px-4 py-2.5 text-[15px] outline-none" required />
          <input value={fNama} onChange={(e)=>setFNama(e.target.value)} placeholder="Nama matkul" className="field px-4 py-2.5 text-[15px] outline-none md:col-span-2" required />
          <input value={fDosen} onChange={(e)=>setFDosen(e.target.value)} placeholder="Dosen (koma bila >1)" className="field px-4 py-2.5 text-[15px] outline-none" />
          <span className="flex gap-2">
            <input value={fSks} onChange={(e)=>setFSks(Number(e.target.value))} type="number" min={1} max={12} title="SKS" className="field w-20 px-4 py-2.5 text-[15px] outline-none" />
            <button className="btn-hard flex flex-1 items-center justify-center gap-1.5 rounded-full bg-(--color-daun) px-3 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-white">
              <Plus size={15} strokeWidth={3} /> Tambah
            </button>
          </span>
        </form>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matkul.map((m) => (
            <MatkulCard key={m.id} m={m} onDelete={() => { if (confirm(`Hapus ${m.nama}? Tugasnya ikut terhapus.`)) removeMatkul(m.id); }} />
          ))}
        </div>
      </section>
    </Shell>
  );
}

function PjAtur({ matkulId }: { matkulId: string }) {
  const { users, matkulById, tambahPj, hapusPj } = useStore();
  const [pilih, setPilih] = useState("");
  const m = matkulById(matkulId);
  if (!m) return null;
  const pj = (m.pjIds ?? []).map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const kandidat = [...users]
    .filter((u) => u.role !== "admin" && !(m.pjIds ?? []).includes(u.id))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  return (
    <div className="rounded-2xl bg-(--color-cream) p-3.5">
      <p className="flex items-center gap-2 text-[14px] font-extrabold">
        <span className="h-3 w-3 rounded-full" style={{ background: m.warna }} />
        {m.nama}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {pj.map((u) => (
          <span key={u!.id} className="flex items-center gap-1.5 rounded-full bg-(--color-card) px-3 py-1 text-[13px] font-extrabold">
            {u!.nama}
            <button
              onClick={() => hapusPj(m.id, u!.id)}
              title="Lepas PJ"
              className="font-black text-(--color-apel) hover:scale-125"
            >
              ×
            </button>
          </span>
        ))}
        {!pj.length && (
          <span className="text-[13px] font-bold text-(--color-faint)">Belum ada PJ — sementara admin yang menyimpulkan.</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <select
          value={pilih}
          onChange={(e) => setPilih(e.target.value)}
          className="field min-w-0 flex-1 px-3 py-2 text-[14px] font-semibold outline-none"
        >
          <option value="">Pilih anggota…</option>
          {kandidat.map((u) => (
            <option key={u.id} value={u.id}>{u.nama}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!pilih) return;
            tambahPj(m.id, pilih);
            setPilih("");
          }}
          className="btn-hard shrink-0 rounded-full bg-(--color-ink) px-4 py-2 text-[12px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]"
        >
          Jadikan PJ
        </button>
      </div>
    </div>
  );
}

function PesertaAtur({ matkulId }: { matkulId: string }) {
  const { users, matkulById, setPeserta } = useStore();
  const [cari, setCari] = useState("");
  const m = matkulById(matkulId);
  if (!m) return null;
  const semua = (m.anggotaIds ?? []).length === 0;
  const terurut = [...users].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  const saring = terurut.filter((u) => u.nama.toLowerCase().includes(cari.toLowerCase()));

  function toggle(uid: string) {
    const sekarang = m!.anggotaIds ?? [];
    // dari mode "semua" → mulai dengan semua lalu keluarkan yang diklik
    const dasar = sekarang.length === 0 ? users.map((u) => u.id) : sekarang;
    const baru = dasar.includes(uid) ? dasar.filter((x) => x !== uid) : [...dasar, uid];
    setPeserta(m!.id, baru.length >= users.length ? [] : baru);
  }

  return (
    <div className="rounded-2xl bg-(--color-cream) p-3.5">
      <p className="flex items-center gap-2 text-[14px] font-extrabold">
        <span className="h-3 w-3 rounded-full" style={{ background: m.warna }} />
        {m.nama}
      </p>
      <p className="mt-1 flex items-center gap-2 text-[13px] font-bold text-(--color-soft)">
        <button
          onClick={() => setPeserta(m.id, [])}
          className={`rounded-full px-3 py-1 ${semua ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]" : "border-2 border-(--color-line) bg-(--color-card)"}`}
        >
          Seluruh kelas
        </button>
        {!semua && <span>{(m.anggotaIds ?? []).length} peserta</span>}
      </p>
      <input
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari nama…"
        className="field mt-2 w-full px-3 py-1.5 text-[13px] outline-none"
      />
      <div className="mt-1.5 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto pr-1">
        {saring.map((u) => {
          const ikut = semua || (m.anggotaIds ?? []).includes(u.id);
          return (
            <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-(--color-card) px-2.5 py-1.5 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={ikut}
                onChange={() => toggle(u.id)}
                className="h-4 w-4 accent-[#e8552f]"
              />
              <span className="min-w-0 flex-1 truncate">{u.nama}</span>
              {u.role === "pj" && (
                <span className="rounded-full bg-(--color-apel) px-1.5 py-0.5 text-[9px] font-extrabold text-white">PJ</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
