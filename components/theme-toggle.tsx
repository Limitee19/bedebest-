"use client";

import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tongban-theme", next ? "dark" : "light");
    } catch { /* abaikan */ }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className={`flex items-center gap-2 rounded-full border-2 border-(--color-line) bg-(--color-card) font-bold text-(--color-ink) transition-transform hover:-translate-y-0.5 ${
        compact ? "p-2" : "px-3.5 py-2 text-[13px]"
      }`}
    >
      {dark ? <Sun size={17} /> : <MoonStar size={17} />}
      {!compact && (dark ? "Mode terang" : "Mode gelap")}
    </button>
  );
}
