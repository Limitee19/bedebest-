import { NextResponse } from "next/server";
import { differenceInCalendarDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { kirimPush, pushSiap, type SubPush } from "@/lib/push";
import { bacaMemori, hapusSub, supabaseAdmin } from "@/lib/push-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dijalankan Vercel Cron tiap 00:00 WIB (17:00 UTC sehari sebelumnya).
 * Vercel otomatis mengirim Authorization: Bearer <CRON_SECRET> bila
 * variabel CRON_SECRET didefinisikan. Tanpa secret yang cocok → 401,
 * supaya penyerang tidak bisa memicu ledakan notifikasi (dan biaya).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret) {
    if (process.env.NODE_ENV !== "development")
      return NextResponse.json({ ok: false, pesan: "CRON_SECRET belum diset." }, { status: 401 });
  } else if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, pesan: "Tidak berwenang." }, { status: 401 });
  }

  if (!pushSiap())
    return NextResponse.json({ ok: false, pesan: "VAPID belum dikonfigurasi." }, { status: 501 });

  const sb = supabaseAdmin();
  if (!sb) {
    // Mode lokal: server tidak punya akses data browser — cron butuh Supabase.
    const n = bacaMemori().length;
    return NextResponse.json({
      ok: false,
      pesan: `Tanpa Supabase, cron tidak bisa membaca tugas. ${n} subscription memori diabaikan.`,
    });
  }

  const [{ data: matkul }, { data: tugas }, { data: subs }, { data: prof }] = await Promise.all([
    sb.from("matkul").select("id,nama,jadwal,anggota_ids,pj_ids"),
    sb.from("tugas").select("id,matkul_id,judul,deadline_at,status,selesai_oleh"),
    sb.from("push_subscriptions").select("user_id,endpoint,p256dh,auth"),
    sb.from("profiles").select("id,role"),
  ]);
  if (!matkul || !tugas || !subs)
    return NextResponse.json({ ok: false, pesan: "Gagal membaca database." }, { status: 500 });

  const peran = new Map((prof ?? []).map((p) => [String(p.id), String(p.role)]));
  /** Matkul yang boleh dilihat user ini (admin / PJ / peserta / seluruh kelas). */
  const terlihat = (uid: string) =>
    (matkul as { id: string; anggota_ids: string[] | null; pj_ids: string[] | null }[]).filter(
      (m) =>
        peran.get(uid) === "admin" ||
        (m.pj_ids ?? []).includes(uid) ||
        (m.anggota_ids ?? []).length === 0 ||
        (m.anggota_ids ?? []).includes(uid)
    );

  const now = new Date();
  const namaMatkul = new Map(matkul.map((m) => [m.id as string, m.nama as string]));
  const kunci = format(now, "EEEE", { locale: localeId }).toLowerCase().trim();
  // cocokkan semua sesi (satu matkul bisa Senin + Sabtu). Samakan persis nama
  // hari (lowercase trim), bukan includes/slice, agar "Senin" tak cocok "Seni".
  const jadwal = matkul.flatMap((m) =>
    ((m.jadwal as { hari: string; jam: string; ruang: string }[] | null) ?? [])
      .filter((s) => String(s.hari).toLowerCase().trim() === kunci)
      .map((s) => ({ matkulId: String(m.id), nama: String(m.nama), jam: String(s.jam), ruang: String(s.ruang) }))
  );

  let terkirim = 0;
  let gagal = 0;
  for (const s of subs) {
    const uid = String(s.user_id);
    const boleh = new Set(terlihat(uid).map((m) => String(m.id)));
    const ingat = (tugas as never[] as {
      id: string; matkul_id: string; judul: string; deadline_at: string;
      status: string; selesai_oleh: string[] | null;
    }[])
      .filter(
        (t) =>
          t.status === "resmi" &&
          boleh.has(String(t.matkul_id)) &&
          !(t.selesai_oleh ?? []).includes(uid)
      )
      .map((t) => ({ t, sisa: differenceInCalendarDays(new Date(t.deadline_at), now) }))
      .filter((x) => x.sisa >= 0 && x.sisa <= 3)
      .sort((a, b) => a.sisa - b.sisa);

    const baris: string[] = [];
    if (ingat.length)
      baris.push(
        `${ingat.length} tugas perlu perhatian: ` +
          ingat
            .slice(0, 3)
            .map((x) => `${x.t.judul} (${namaMatkul.get(x.t.matkul_id) ?? ""}, H-${x.sisa})`)
            .join(", ")
      );
    if (jadwal.length) {
      const jdSaya = jadwal.filter((j) => boleh.has(j.matkulId));
      if (jdSaya.length)
        baris.push(
          `Jadwal hari ini: ` +
            jdSaya.map((j) => `${j.nama} ${j.jam} @ ${j.ruang}`).join(" · ")
        );
    }
    if (!baris.length) continue;

    const sub: SubPush = {
      endpoint: String(s.endpoint),
      keys: { p256dh: String(s.p256dh), auth: String(s.auth) },
    };
    try {
      await kirimPush(
        sub,
        `BeDeBest · ${ingat.length ? `${ingat.length} deadline mendekat` : "Jadwal hari ini"}`,
        baris.join("\n")
      );
      terkirim++;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await hapusSub(sub.endpoint); // user mencabut izin / uninstall
      } else {
        gagal++;
      }
    }
  }
  return NextResponse.json({ ok: true, terkirim, gagal, totalSub: subs.length });
}
