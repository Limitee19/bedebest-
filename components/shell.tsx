"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { sudahSelesai, useStore } from "@/lib/store";
import { tugasTerlihat } from "@/lib/data";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Bell, usePengingat } from "./bell";

const NAV = [
  { href: "/", label: "Dasbor", icon: LayoutDashboard, dot: "bg-(--color-apel)" },
  { href: "/matkul", label: "Matkul", icon: BookOpenText, dot: "bg-(--color-sky)" },
  { href: "/tugas", label: "Tugas", icon: ClipboardList, dot: "bg-(--color-lemon)" },
  { href: "/kalender", label: "Kalender", icon: CalendarDays, dot: "bg-(--color-mint)" },
  { href: "/arsip", label: "Arsip", icon: Archive, dot: "bg-(--color-anggur)" },
  { href: "/aktivitas", label: "Riwayat", icon: History, dot: "bg-(--color-pink)" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout, tugas, matkul } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  usePengingat();

  useEffect(() => {
    if (user === null) {
      const t = setTimeout(() => router.replace("/login"), 350);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4">
        <p className="font-display animate-pulse text-xl font-bold text-(--color-faint)">
          Menyiapkan papan tulis…
        </p>
      </div>
    );
  }

  const terbuka = tugasTerlihat(tugas, matkul, user).filter(
    (t) => t.status === "resmi" && !sudahSelesai(t, user?.id)
  ).length;
  const matkulPj = user ? matkul.filter((m) => (m.pjIds ?? []).includes(user.id)) : [];
  const labelPeran =
    user?.role === "admin"
      ? "Admin kelas"
      : user?.role === "pj"
        ? `PJ · ${matkulPj.length} matkul`
        : "Anggota";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-5 px-4 py-5 md:px-6">
      {/* Sidebar */}
      <aside className="paper-card sticky top-5 hidden h-fit w-64 shrink-0 flex-col p-5 md:flex">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="mt-5 flex flex-col gap-1.5">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-bold transition-all ${
                  active
                    ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                    : "text-(--color-soft) hover:bg-(--color-cream)"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-(--color-lemon)" : n.dot}`} />
                <n.icon size={18} strokeWidth={2.4} />
                {n.label}
              </Link>
            );
          })}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-bold transition-all ${
                pathname.startsWith("/admin")
                  ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                  : "text-(--color-soft) hover:bg-(--color-cream)"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-(--color-pink)" />
              <ShieldCheck size={18} strokeWidth={2.4} />
              Kelola Kelas
            </Link>
          )}
        </nav>

        {/* Kartu semangat */}
        <div className="relative mt-5 overflow-hidden rounded-2xl bg-(--color-lemon-soft) p-4">
          <Sparkles size={64} className="absolute -right-3 -top-3 rotate-12 text-(--color-lemon)" opacity={0.35} />
          <p className="font-display text-4xl font-bold leading-none">{terbuka}</p>
          <p className="mt-1 text-[13px] font-semibold leading-snug text-(--color-soft)">
            tugas resmi belum selesai. Pelan-pelan, satu per satu!
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="flex-1">
            <ThemeToggle />
          </span>
          <Bell />
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t-2 border-dashed border-(--color-line) pt-4">
          <span className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-(--color-apel) text-lg font-bold text-white">
            {user.nama.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[14px] font-extrabold">{user.nama}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-(--color-faint)">
              {labelPeran}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            title="Keluar"
            className="rounded-xl border-2 border-(--color-line) p-2 text-(--color-soft) hover:bg-(--color-cream)"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Kolom konten */}
      <div className="min-w-0 flex-1">
        {/* Header mobile */}
        <div className="paper-card mb-4 flex items-center justify-between gap-2 p-3 md:hidden">
          <Link href="/">
            <Logo size={34} />
          </Link>
          <span className="flex items-center gap-2">
            <Bell />
            <ThemeToggle compact />
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-full border-2 border-(--color-line) p-2"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </span>
        </div>
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-[14px] font-bold ${
                pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href))
                  ? "border-(--color-ink) bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                  : "border-(--color-line) bg-(--color-card)"
              }`}
            >
              <n.icon size={16} />
              {n.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[14px] font-bold"
            >
              <ShieldCheck size={16} />
              Kelola
            </Link>
          )}
        </nav>
        {children}
        <footer className="mt-8 border-t-2 border-dashed border-(--color-line) pt-3 text-center text-[12px] font-semibold text-(--color-faint)">
          BeDeBest · ruang kelas Offering B(EST) PBM · 加油!
        </footer>
      </div>
    </div>
  );
}
