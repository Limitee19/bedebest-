"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { matkulTerlihat } from "@/lib/data";
import { Shell } from "@/components/shell";
import { MatkulCard } from "@/components/matkul-card";
import { SectionTitle } from "@/components/bits";

export default function MatkulPage() {
  const { matkul, removeMatkul, user } = useStore();
  const [q, setQ] = useState("");
  const [sem, setSem] = useState("semua");

  const list = useMemo(() => {
    return matkul
      .filter((m) => matkulTerlihat(m, user))
      .filter((m) => {
        const hit =
          m.nama.toLowerCase().includes(q.toLowerCase()) ||
          m.kode.toLowerCase().includes(q.toLowerCase()) ||
          m.dosen.join(" ").toLowerCase().includes(q.toLowerCase());
        return hit && (sem === "semua" || String(m.semester) === sem);
      });
  }, [matkul, q, sem, user]);

  const isAdmin = user?.role === "admin";

  return (
    <Shell>
      <SectionTitle
        no="✿"
        title="Mata Kuliah"
        desc={`${matkul.length} matkul · Semester 1 · Offering B(EST) PBM`}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="field flex flex-1 items-center gap-2 px-4 py-3">
          <Search size={18} className="shrink-0 text-(--color-faint)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode, nama matkul, atau dosen…"
            className="w-full bg-transparent text-[15px] font-medium outline-none"
          />
        </label>
        <select
          value={sem}
          onChange={(e) => setSem(e.target.value)}
          className="field cursor-pointer px-4 py-3 text-[15px] font-bold"
        >
          <option value="semua">Semua Semester</option>
          <option value="1">Semester 1</option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((m) => (
          <MatkulCard
            key={m.id}
            m={m}
            onDelete={isAdmin ? () => { if (confirm(`Hapus ${m.nama}?`)) removeMatkul(m.id); } : undefined}
          />
        ))}
      </div>
      {!list.length && (
        <p className="paper-card mt-2 p-6 text-center text-[15px] text-(--color-soft)">
          Tidak ketemu. Coba kata kunci lain.
        </p>
      )}
    </Shell>
  );
}
