import { NextResponse } from "next/server";
import { pushSiap, validasiSub } from "@/lib/push";
import { simpanMemori, supabaseAdmin } from "@/lib/push-store";

export const runtime = "nodejs";

/**
 * Menyimpan subscription Web Push per perangkat.
 *
 * Batasan jujur: endpoint ini belum memverifikasi kepemilikan userId via
 * Supabase Auth (aplikasi masih login lokal). Mitigasi yang dipasang:
 * - userId dibatasi pola aman (huruf/angka/dash, maks 64) — bukan bebas
 * - subscription divalidasi ketat (endpoint https + keys)
 * - rate limit global via middleware (30/menit/IP, /api/*)
 * Saat migrasi ke Supabase Auth: ganti userId body dengan auth.uid()
 * dari Bearer token, dan tolak bila tidak cocok.
 */
const POLA_USER = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(req: Request) {
  if (!pushSiap())
    return NextResponse.json(
      { ok: false, mode: "tanpa-vapid", pesan: "VAPID belum dikonfigurasi di server." },
      { status: 501 }
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, pesan: "Body bukan JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const mentah = typeof b.userId === "string" ? b.userId.trim().slice(0, 64) : "";
  const sub = b.subscription as unknown;
  if (!POLA_USER.test(mentah) || !validasiSub(sub))
    return NextResponse.json({ ok: false, pesan: "userId/subscription tidak valid." }, { status: 400 });
  const userId = mentah;

  const sb = supabaseAdmin();
  if (!sb) {
    simpanMemori(userId, sub);
    return NextResponse.json({ ok: true, mode: "memori-dev" });
  }

  const { error } = await sb.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: "endpoint" }
  );
  if (error)
    return NextResponse.json({ ok: false, pesan: "Gagal menyimpan subscription." }, { status: 500 });
  return NextResponse.json({ ok: true, mode: "supabase" });
}
