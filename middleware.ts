import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rate limit sederhana untuk /api/* (anti spam & anti sedot biaya Gemini).
 * Default 30 request/menit per IP; endpoint mahal (/api/rangkuman) lebih ketat:
 * 15/menit. In-memory: cukup untuk 1 instance; bila scale ke banyak instance
 * / butuh limit global anti-bypass, ganti dengan Upstash Redis.
 */
const BATAS = 30;
const BATAS_RANGKUMAN = 15;
const JENDELA_MS = 60_000;
const hit = new Map<string, number[]>();

function ipDari(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (fwd) return fwd.slice(0, 64);
  return (
    req.headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown"
  );
}

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const ip = ipDari(req);
  const path = req.nextUrl.pathname;
  const batas = path.startsWith("/api/rangkuman") ? BATAS_RANGKUMAN : BATAS;
  const kunci = `${ip}:${path.split("/").slice(0, 4).join("/")}`;
  const sekarang = Date.now();
  const riwayat = (hit.get(kunci) ?? []).filter((t) => sekarang - t < JENDELA_MS);
  if (riwayat.length >= batas) {
    return NextResponse.json(
      { ok: false, pesan: "Terlalu banyak permintaan, coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  riwayat.push(sekarang);
  hit.set(kunci, riwayat);
  // cegah bocor memori: bersihkan entri basi sesekali
  if (hit.size > 5000) {
    for (const [k, v] of hit) {
      if (!v.some((t) => sekarang - t < JENDELA_MS)) hit.delete(k);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
