"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, KeyRound, PartyPopper } from "lucide-react";
import { useStore } from "@/lib/store";
import { ADMIN_NIM, KELAS } from "@/lib/data";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const { user, login, users, mode, cloudSiap } = useStore();
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  if (user) return null;

  const terurut = [...users].sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setError(null);
    try {
      const err = await login(nama, nim);
      if (err) setError(err);
      else router.replace("/");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-4xl flex-1 items-center gap-5 self-center py-8 md:grid-cols-2">
        {/* Panel identitas */}
        <div className="paper-card relative overflow-hidden p-7 md:p-8">
          <GraduationCap size={110} className="absolute -bottom-4 -right-4 rotate-12 text-(--color-sky)" opacity={0.18} />
          <Logo size={46} />
          <div className="mt-7">
            <span className="sticker inline-block bg-(--color-mint) px-3 py-1 text-[12px] font-extrabold uppercase tracking-widest text-white">
              {KELAS}
            </span>
            <h1 className="font-display mt-3 text-[32px] font-bold leading-[1.05] sm:text-[42px] sm:leading-[1.02]">
              Satu papan,
              <br />
              semua tugas
              <br />
              sekelas!
            </h1>
            <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-(--color-soft)">
              Siapa pun boleh melapor info tugas, PJ menyimpulkan jadi tugas resmi,
              dan dasbor merangkum minggu kalian otomatis.
            </p>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 border-t-2 border-dashed border-(--color-line) pt-4 text-center">
            {[
              [String(users.length || 33), "anggota", "bg-(--color-sky-soft)"],
              ["6", "matkul", "bg-(--color-lemon-soft)"],
              ["1", "papan", "bg-(--color-pink-soft)"],
            ].map(([n, l, bg]) => (
              <div key={l} className={`rounded-2xl ${bg} py-2.5`}>
                <p className="font-display tnum text-2xl font-bold">{n}</p>
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-(--color-soft)">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form masuk */}
        <div className="paper-card p-7 md:p-8">
          <p className="font-display flex items-center gap-2 text-[28px] font-bold">
            <PartyPopper size={26} className="text-(--color-apel)" />
            Masuk dulu, yuk!
          </p>
          <p className="mt-1 text-[15px] text-(--color-soft)">
            Pilih namamu, lalu isi NIM sebagai kata sandi.
          </p>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
            <label className="text-[15px] font-extrabold">
              Nama lengkap
              <span className="field mt-1.5 flex items-center gap-2 px-4 py-3">
                <GraduationCap size={18} className="shrink-0 text-(--color-faint)" />
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  list="daftar-nama"
                  autoComplete="off"
                  className="w-full bg-transparent text-[15px] font-semibold outline-none"
                  placeholder="Ketik namamu…"
                />
              </span>
              <datalist id="daftar-nama">
                {terurut.map((u) => (
                  <option key={u.id} value={u.nama} />
                ))}
              </datalist>
            </label>
            <label className="text-[15px] font-extrabold">
              NIM (kata sandi)
              <span className="field mt-1.5 flex items-center gap-2 px-4 py-3">
                <KeyRound size={17} className="shrink-0 text-(--color-faint)" />
                <input
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  required
                  className="w-full bg-transparent text-[15px] font-semibold outline-none"
                  placeholder="cth. 2602426xxxxx"
                />
              </span>
            </label>
            {error && (
              <p className="rounded-2xl bg-(--color-apel-soft) px-4 py-2.5 text-[14px] font-bold text-(--color-apel)">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={sibuk}
              className="btn-hard font-display mt-1 rounded-full bg-(--color-apel) px-4 py-3.5 text-[18px] font-bold text-white disabled:opacity-60"
            >
              {sibuk ? "Masuk…" : "Masuk ke papan"}
            </button>
          </form>
          <div className="mt-5 rounded-2xl bg-(--color-cream) p-3.5 text-[13px] leading-relaxed text-(--color-soft)">
            {users.length} akun Offering B(EST) PBM terdaftar. Admin: Muhammad Ariel
            Fathoni (NIM {ADMIN_NIM}).
            {mode === "cloud" && cloudSiap ? (
              <> Data tersambung cloud — HP & laptop sinkron realtime.</>
            ) : (
              <> Menyambungkan ke cloud… bila gagal, mode lokal sementara dipakai.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
