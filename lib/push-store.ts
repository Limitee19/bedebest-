import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SubPush } from "./push";

/** Klien service-role (melewati RLS) — hanya dipakai di server. */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !srv) return null;
  return createClient(url, srv);
}

/** Fallback dev: subscription disimpan di memori bila Supabase belum diset. */
const memori = new Map<string, { userId: string; sub: SubPush }>();

export function simpanMemori(userId: string, sub: SubPush) {
  memori.set(sub.endpoint, { userId, sub });
}

export function bacaMemori() {
  return [...memori.values()];
}

export async function hapusSub(endpoint: string) {
  memori.delete(endpoint);
  const sb = supabaseAdmin();
  if (sb) await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
