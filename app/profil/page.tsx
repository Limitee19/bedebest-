"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";

export default function ProfilPage() {
  const { user, gantiPassword } = useStore();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (baru !== ulang) {
      setPesan({ ok: false, teks: "Konfirmasi tidak sama dengan kata sandi baru." });
      return;
    }
    const err = gantiPassword(lama, baru);
    if (err) setPesan({ ok: false, teks: err });
    else {
      setPesan({ ok: true, teks: "Kata sandi berhasil diganti! Ingat-ingat yang baru ya." });
      setLama("");
      setBaru("");
      setUlang("");
    }
  }

  return (
    <Shell>
      <SectionTitle no="☺" title="Profilku" desc="Kelola akunmu sendiri." />

      <div className="paper-card flex items-center gap-3.5 p-5">
        <span className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-(--color-apel) text-2xl font-bold text-white">
          {user?.nama.charAt(0)}
        </span>
        <div>
          <p className="font-display text-[22px] font-bold leading-tight">{user?.nama}</p>
          <p className="tnum text-[14px] font-bold text-(--color-soft)">NIM {user?.nim}</p>
          <p className="mt-0.5 inline-block rounded-full bg-(--color-cream) px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-widest text-(--color-soft)">
            {user?.role === "admin" ? "Admin kelas" : user?.role === "pj" ? "PJ matkul" : "Anggota"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="paper-card mt-4 p-5 md:p-6">
        <h3 className="font-display flex items-center gap-2 text-[20px] font-bold">
          <KeyRound size={19} /> Ganti kata sandi
        </h3>
        <p className="mt-0.5 text-[14px] text-(--color-soft)">
          Awalnya kata sandimu adalah NIM. Ganti dengan yang hanya kamu tahu.
          Minimal 6 karakter.
        </p>
        <div className="mt-3.5 grid gap-3 md:grid-cols-3">
          <label className="text-[14px] font-extrabold">
            Kata sandi lama
            <input
              value={lama}
              onChange={(e) => setLama(e.target.value)}
              type="password"
              required
              className="field mt-1.5 w-full px-4 py-2.5 text-[15px] outline-none"
              placeholder="••••••••"
            />
          </label>
          <label className="text-[14px] font-extrabold">
            Kata sandi baru
            <input
              value={baru}
              onChange={(e) => setBaru(e.target.value)}
              type="password"
              required
              minLength={6}
              className="field mt-1.5 w-full px-4 py-2.5 text-[15px] outline-none"
              placeholder="Minimal 6 karakter"
            />
          </label>
          <label className="text-[14px] font-extrabold">
            Ulangi yang baru
            <input
              value={ulang}
              onChange={(e) => setUlang(e.target.value)}
              type="password"
              required
              className="field mt-1.5 w-full px-4 py-2.5 text-[15px] outline-none"
              placeholder="Sama seperti di atas"
            />
          </label>
        </div>
        {pesan && (
          <p className={`mt-3 rounded-2xl px-4 py-2.5 text-[14px] font-bold ${pesan.ok ? "bg-(--color-daun-soft) text-(--color-daun)" : "bg-(--color-apel-soft) text-(--color-apel)"}`}>
            {pesan.teks}
          </p>
        )}
        <button type="submit" className="btn-hard mt-3.5 rounded-full bg-(--color-ink) px-6 py-2.5 text-[13px] font-extrabold uppercase tracking-widest text-[#fff6e8] dark:text-[#181222]">
          Simpan kata sandi baru
        </button>
        <p className="mt-3 flex items-start gap-1.5 text-[12px] font-medium leading-relaxed text-(--color-faint)">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Lupa kata sandi barumu? Minta admin meresetnya kembali ke NIM lewat
          halaman Kelola Kelas.
        </p>
      </form>
    </Shell>
  );
}
