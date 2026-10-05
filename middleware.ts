import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rate limit sederhana untuk /api/* (anti spam & anti sedot biaya Gemini).
 * 30 request/menit per IP. In-memory: cukup untuk 1 instance; bila nanti
 * scale ke banyak instance / butuh limit global, ganti dengan Upstash Redis.
 */
const BATAS = 30;
const JENDELA_MS = 60_000;
const hit = new Map<string, number[]>();

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const kunci = `${ip}:${req.nextUrl.pathname.split("/").slice(0, 4).join("/")}`;
  const sekarang = Date.now();
  const riwayat = (hit.get(kunci) ?? []).filter((t) => sekarang - t < JENDELA_MS);
  if (riwayat.length >= BATAS) {
    return NextResponse.json(
      { ok: false, pesan: "Terlalu banyak permintaan, coba lagi sebentar." },
      { status: 429 }
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
