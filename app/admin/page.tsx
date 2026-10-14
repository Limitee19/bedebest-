"use client";

import { useState } from "react";
import { BookOpenText, CalendarDays, Plus, RotateCcw, Trash2, UserRound, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import { ADMIN_EMAIL, ADMIN_NIM } from "@/lib/data";
import { MatkulCard } from "@/components/matkul-card";
import { ModalTambahMatkul, ModalUbahMatkul } from "@/components/matkul-form";
import { ConfirmModal } from "@/components/confirm";

const TABS = [
  { id: "anggota", label: "Anggota", icon: Users },
  { id: "pj", label: "PJ Matkul", icon: UserRound },
  { id: "matkul", label: "Matkul", icon: BookOpenText },
  { id: "peserta", label: "Peserta", icon: Users },
  { id: "semester", label: "Semester", icon: CalendarDays },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const { user, users, addUser, removeUser, resetPassword, matkul, removeMatkul, notify } = useStore();
  const [tab, setTab] = useState<TabId>("anggota");
  const [editMk, setEditMk] = useState<string | null>(null);
  const [tambahMk, setTambahMk] = useState(false);
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [hapusUserId, setHapusUserId] = useState<string | null>(null);
  const [hapusMkId, setHapusMkId] = useState<string | null>(null);

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
          Halaman ini khusus admin kelas. Kamu masuk sebagai <b>{user.nama}</b>.
        </p>
      </Shell>
    );
  }

  function tambahUser(e: React.FormEvent) {
    e.preventDefault();
    const er = addUser(nama.trim(), nim.trim());
    if (er) setErr(er);
    else {
      setNama("");
      setNim("");
      setErr(null);
      notify(`Akun “${nama.trim()}” dibuat. Sandi = NIM.`);
    }
  }

  return (
    <Shell>
      <SectionTitle no="⚙" title="Kelola Kelas" desc={`${users.length} akun · ${matkul.length} matkul · admin ${ADMIN_NIM}`} />

      {/* Navbar tab */}
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-5 py-2.5 text-[14px] font-extrabold transition-all ${
              tab === t.id
                ? "border-(--color-ink) bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                : "border-(--color-line) bg-(--color-card) text-(--color-soft) hover:border-(--color-faint)"
            }`}
          >
            <t.icon size={16} strokeWidth={2.6} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "anggota" && (
        <section className="paper-card p-4 md:p-6">
          <h3 className="font-display text-[22px] font-bold">Anggota ({users.length})</h3>
          <p className="mt-0.5 text-[14px] text-(--color-soft)">
            Kata sandi setiap akun = NIM masing-masing. Bisa direset kapan pun.
          </p>
          <form onSubmit={tambahUser} className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <input value={nama} onChange={(e)=>setNama(e.target.value)} placeholder="Nama lengkap" className="field min-w-0 px-4 py-2.5 text-[15px] outline-none md:col-span-2" required />
            <input value={nim} onChange={(e)=>setNim(e.target.value)} inputMode="numeric" placeholder="NIM (jadi kata sandi)" className="field min-w-0 px-4 py-2.5 text-[15px] outline-none" required />
            <button className="btn-hard flex items-center justify-center gap-1.5 rounded-full bg-(--color-ink) px-3 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] sm:col-span-2 md:col-span-1 dark:text-[#181222]">
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
                        <button title="Reset sandi ke NIM" onClick={()=>{ resetPassword(u.id); notify(`Sandi ${u.nama} direset ke NIM-nya.`); }} className="rounded-xl border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-lemon-soft)">
                          <RotateCcw size={15} />
                        </button>
                        {u.email !== ADMIN_EMAIL && (
                          <button title="Hapus" onClick={()=> setHapusUserId(u.id)} className="rounded-xl border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-apel-soft) hover:text-(--color-apel)">
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
      )}

      {tab === "pj" && (
        <section className="paper-card p-4 md:p-6">
          <h3 className="font-display text-[22px] font-bold">PJ per Mata Kuliah</h3>
          <p className="mt-0.5 text-[14px] text-(--color-soft)">
            PJ hanya berkuasa di matkulnya: menyimpulkan, mengubah, menghapus, dan
            mengarsipkan tugas + mengubah info matkul. 6 matkul → idealnya 6 orang
            berbeda, boleh juga rangkap.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {matkul.map((m) => (
              <PjAtur key={m.id} matkulId={m.id} />
            ))}
          </div>
        </section>
      )}

      {tab === "matkul" && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-[22px] font-bold">Mata kuliah ({matkul.length})</h3>
            <button
              onClick={() => setTambahMk(true)}
              className="btn-hard flex items-center gap-1.5 rounded-full bg-(--color-daun) px-5 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-white"
            >
              <Plus size={15} strokeWidth={3} /> Tambah matkul
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matkul.map((m) => (
              <MatkulCard
                key={m.id}
                m={m}
                onEdit={() => setEditMk(m.id)}
                onDelete={() => setHapusMkId(m.id)}
              />
            ))}
          </div>
          {editMk && <ModalUbahMatkul matkulId={editMk} onTutup={() => setEditMk(null)} />}
          {tambahMk && <ModalTambahMatkul onTutup={() => setTambahMk(false)} />}
        </section>
      )}

      {tab === "peserta" && (
        <section className="paper-card p-4 md:p-6">
          <h3 className="font-display text-[22px] font-bold">Peserta per Mata Kuliah</h3>
          <p className="mt-0.5 text-[14px] text-(--color-soft)">
            Matkul PMDR wajib seluruh kelas — biarkan &quot;Seluruh kelas&quot;. Untuk matkul UNIV,
            centang hanya anak yang mengambilnya. Yang tidak ikut tidak akan melihat
            matkul, tugas, jadwal, maupun notifikasinya.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {matkul.map((m) => (
              <PesertaAtur key={m.id} matkulId={m.id} />
            ))}
          </div>
        </section>
      )}

      {tab === "semester" && <SemesterAtur />}

      <ConfirmModal
        open={hapusUserId !== null}
        bahaya
        judul="Hapus akun ini?"
        pesan="Akun hilang permanen dan tidak bisa dikembalikan."
        batalLabel="Batal"
        yaLabel="Ya, hapus"
        onBatal={() => setHapusUserId(null)}
        onYa={() => {
          if (hapusUserId) {
            const t = users.find((u) => u.id === hapusUserId);
            removeUser(hapusUserId);
            if (t) notify(`Akun “${t.nama}” dihapus.`);
          }
          setHapusUserId(null);
        }}
      />
      <ConfirmModal
        open={hapusMkId !== null}
        bahaya
        judul="Hapus matkul ini?"
        pesan="Matkul + semua tugas dan catatannya ikut terhapus permanen."
        batalLabel="Batal"
        yaLabel="Ya, hapus"
        onBatal={() => setHapusMkId(null)}
        onYa={() => {
          if (hapusMkId) {
            const t = matkul.find((m) => m.id === hapusMkId);
            removeMatkul(hapusMkId);
            if (t) notify(`Matkul “${t.nama}” dihapus.`);
          }
          setHapusMkId(null);
        }}
      />
    </Shell>
  );
}

function SemesterAtur() {
  const { semester, simpanSemester, notify } = useStore();
  const [label, setLabel] = useState(semester.label);
  const [mulai, setMulai] = useState(semester.mulai);
  const [selesai, setSelesai] = useState(semester.selesai);
  const [err, setErr] = useState<string | null>(null);

  function hitungPekan(a: string, b: string) {
    const d1 = new Date(`${a}T12:00:00`).getTime();
    const d2 = new Date(`${b}T12:00:00`).getTime();
    if (Number.isNaN(d1) || Number.isNaN(d2) || d2 < d1) return 0;
    return Math.round((d2 - d1) / 86400000 / 7);
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const gagal = simpanSemester({ label, mulai, selesai });
    if (gagal) {
      setErr(gagal);
      return;
    }
    setErr(null);
    notify(`${label.trim() || "Semester"} tersimpan — kalender ikut update.`);
  }

  return (
    <section className="paper-card p-4 md:p-6">
      <h3 className="font-display text-[22px] font-bold">Semester aktif</h3>
      <p className="mt-0.5 text-[14px] text-(--color-soft)">
        Satu semester aktif. Kalender hanya menampilkan jadwal di rentang ini. Ganti tanggal tiap
        semester baru — matkul lama otomatis ikut semester baru.
      </p>
      <form onSubmit={kirim} className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label, mis. Semester 2"
          maxLength={60}
          className="field min-w-0 px-4 py-2.5 text-[15px] font-bold outline-none sm:col-span-2 md:col-span-1"
          required
        />
        <label className="field flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold">
          Mulai
          <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className="bg-transparent outline-none" required />
        </label>
        <label className="field flex items-center gap-2 px-4 py-2.5 text-[14px] font-bold">
          Selesai
          <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} className="bg-transparent outline-none" required />
        </label>
        <button className="btn-hard rounded-full bg-(--color-ink) px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
          Simpan semester
        </button>
      </form>
      {err && <p className="mt-2 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
      <p className="mt-2 text-[13px] font-bold text-(--color-soft)">
        Sekarang: {semester.label} · {semester.mulai} → {semester.selesai} · ±{hitungPekan(semester.mulai, semester.selesai)} pekan
      </p>
    </section>
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
