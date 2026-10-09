import { NextResponse } from "next/server";
import { ringkasGemini, ringkasLokal } from "@/lib/ringkas";

export const runtime = "nodejs";

/**
 * Cap harian pemakaian Gemini per IP (15x/hari) supaya kunci API tidak
 * bisa disedot orang iseng. Melewati cap → fallback lokal otomatis.
 * Catatan: in-memory = per instance. Di serverless tiap instance punya
 * hitungan sendiri; bila butuh cap global gunakan Upstash Redis.
 */
const CAP = 15;
const MAX_TUGAS = 200;
const MAX_MATKUL = 50;
const pakai = new Map<string, { hari: string; n: number }>();

function bolehAI(ip: string) {
  const hari = new Date().toISOString().slice(0, 10);
  const d = pakai.get(ip);
  if (!d || d.hari !== hari) {
    pakai.set(ip, { hari, n: 1 });
    if (pakai.size > 5000) {
      for (const [k, v] of pakai) if (v.hari !== hari) pakai.delete(k);
    }
    return true;
  }
  if (d.n >= CAP) return false;
  d.n++;
  return true;
}

function bersihTeks(s: unknown, max: number) {
  return typeof s === "string" ? s.slice(0, max) : "";
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, pesan: "Body bukan JSON." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ ok: false, pesan: "Body tidak valid." }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const rawTugas = Array.isArray(b.tugas) ? b.tugas.slice(0, MAX_TUGAS) : [];
    const rawMatkul = Array.isArray(b.matkul) ? b.matkul.slice(0, MAX_MATKUL) : [];
    const tugas = rawTugas
      .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
      .map((t) => ({
        id: bersihTeks(t.id, 64),
        matkulId: bersihTeks(t.matkulId, 64),
        judul: bersihTeks(t.judul, 200),
        deskripsi: bersihTeks(t.deskripsi, 2000),
        deadline: bersihTeks(t.deadline, 64),
        prioritas: t.prioritas === "mendesak" || t.prioritas === "rendah" ? t.prioritas : "sedang",
        status: t.status === "resmi" ? "resmi" : "usulan",
      }));
    const matkul = rawMatkul
      .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
      .map((m) => ({ id: bersihTeks(m.id, 64), nama: bersihTeks(m.nama, 120) }));
    const input = { tugas, matkul };
    if (bolehAI(ip)) {
      const ai = await ringkasGemini(input);
      if (ai) return NextResponse.json({ mode: "gemini", text: ai });
    }
    return NextResponse.json({ mode: "lokal", text: ringkasLokal(input) });
  } catch {
    return NextResponse.json({ mode: "lokal", text: "Belum ada data tugas untuk dirangkum." });
  }
}
