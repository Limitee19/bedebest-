import { NextResponse } from "next/server";
import { ringkasGemini, ringkasLokal } from "@/lib/ringkas";

export const runtime = "nodejs";

/**
 * Cap harian pemakaian Gemini per IP (15x/hari) supaya kunci API tidak
 * bisa disedot orang iseng. Melewati cap → fallback lokal otomatis.
 */
const CAP = 15;
const pakai = new Map<string, { hari: string; n: number }>();

function bolehAI(ip: string) {
  const hari = new Date().toISOString().slice(0, 10);
  const d = pakai.get(ip);
  if (!d || d.hari !== hari) {
    pakai.set(ip, { hari, n: 1 });
    return true;
  }
  if (d.n >= CAP) return false;
  d.n++;
  return true;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await req.json();
    const input = { tugas: body.tugas ?? [], matkul: body.matkul ?? [] };
    if (bolehAI(ip)) {
      const ai = await ringkasGemini(input);
      if (ai) return NextResponse.json({ mode: "gemini", text: ai });
    }
    return NextResponse.json({ mode: "lokal", text: ringkasLokal(input) });
  } catch {
    return NextResponse.json({ mode: "lokal", text: "Belum ada data tugas untuk dirangkum." });
  }
}
