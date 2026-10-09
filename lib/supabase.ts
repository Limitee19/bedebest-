import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Normalisasi URL: buang `/rest/v1`, `/auth/v1`, trailing slash. */
export function normalUrl(raw: string) {
  let u = raw.trim().replace(/\/+$/, "");
  u = u.replace(/\/(rest|auth)\/v1$/i, "");
  return u;
}

export function supabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  return normalUrl(raw);
}

export function supabase(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
