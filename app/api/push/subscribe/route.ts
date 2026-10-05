import { NextResponse } from "next/server";
import { pushSiap, validasiSub } from "@/lib/push";
import { simpanMemori, supabaseAdmin } from "@/lib/push-store";

export const runtime = "nodejs";

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
  const userId = typeof b.userId === "string" ? b.userId.trim().slice(0, 64) : "";
  const sub = b.subscription as unknown;
  if (!userId || !validasiSub(sub))
    return NextResponse.json({ ok: false, pesan: "userId/subscription tidak valid." }, { status: 400 });

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
