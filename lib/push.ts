import "server-only";
import webpush from "web-push";

let siap = false;

/** true bila VAPID terkonfigurasi dan web-push siap mengirim. */
export function pushSiap() {
  if (siap) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const prv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !prv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@bedebest.local",
    pub,
    prv
  );
  siap = true;
  return true;
}

export interface SubPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function validasiSub(body: unknown): body is SubPush {
  if (typeof body !== "object" || body === null) return false;
  const s = body as Record<string, unknown>;
  if (typeof s.endpoint !== "string" || !s.endpoint.startsWith("https://")) return false;
  const k = s.keys as Record<string, unknown> | undefined;
  return !!k && typeof k.p256dh === "string" && typeof k.auth === "string";
}

export async function kirimPush(sub: SubPush, judul: string, isi: string) {
  const payload = JSON.stringify({ title: judul, body: isi, url: "/" });
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: sub.keys } as never,
    payload
  );
}
