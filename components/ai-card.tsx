"use client";

import { useState } from "react";
import { Sparkles, WandSparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { matkulTerlihat, tugasTerlihat } from "@/lib/data";
import { ringkasLokal } from "@/lib/ringkas";

export function AiCard() {
  const { user, tugas, matkul } = useStore();
  const [text, setText] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function muat() {
    setLoading(true);
    const mkSaya = matkul.filter((m) => matkulTerlihat(m, user));
    const tgsSaya = tugasTerlihat(tugas, matkul, user);
    try {
      const res = await fetch("/api/rangkuman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tugas: tgsSaya, matkul: mkSaya }),
      });
      const json = await res.json();
      setText(json.text);
      setMode(json.mode);
    } catch {
      setText(ringkasLokal({ tugas: tgsSaya, matkul: mkSaya }));
      setMode("lokal");
    }
    setLoading(false);
  }

  return (
    <section className="paper-card relative overflow-hidden p-5 md:p-6">
      <Sparkles size={90} className="absolute -right-4 -top-4 rotate-12 text-(--color-lemon)" opacity={0.25} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--color-anggur) text-white">
          <WandSparkles size={20} />
        </span>
        <h3 className="font-display text-[22px] font-bold">Rangkuman Cerdas</h3>
        <span className="sticker bg-(--color-lemon-soft) px-2.5 py-0.5 text-[11px] font-extrabold text-(--color-ink)">
          {mode === "gemini" ? "Gemini AI" : mode === "lokal" ? "Otomatis" : "AI"}
        </span>
      </div>
      <div>
        {text ? (
          <div className="mt-3 space-y-2.5 text-[15px] leading-relaxed">
            {text.split("\n\n").map((p, i) => (
              <p key={i} className="rounded-2xl bg-(--color-cream) p-3.5">{p}</p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-(--color-soft)">
            Tekan tombol di bawah untuk menyusun semua deadline 14 hari ke depan jadi
            satu bacaan rapi: mana yang mendesak, hari apa paling padat, dan apa yang
            sebaiknya dicicil duluan.
          </p>
        )}
        <button
          onClick={muat}
          disabled={loading}
          className="btn-hard font-display mt-4 flex items-center gap-2 rounded-full bg-(--color-ink) px-6 py-2.5 text-[16px] font-bold text-[#fff6e8] disabled:opacity-60 dark:text-[#181222]"
        >
          <WandSparkles size={17} className={loading ? "animate-spin" : ""} />
          {loading ? "Menyusun…" : text ? "Susun ulang" : "Susun rangkuman"}
        </button>
        <p className="mt-2.5 text-[12px] font-medium text-(--color-faint)">
          Isi GEMINI_API_KEY di .env untuk memakai Gemini asli. Tanpa itu, rangkuman
          disusun otomatis dari data deadline.
        </p>
      </div>
    </section>
  );
}
