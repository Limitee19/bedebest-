import { NextResponse } from "next/server";

export const runtime = "nodejs";

const POLA_ID = /^[A-Za-z0-9_-]{10,}$/;
const MAKS = 200;

function dekodeEntitas(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCharCode(Number(n));
      } catch {
        return "";
      }
    })
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .trim();
}

function kupasTag(s: string) {
  return dekodeEntitas(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).slice(0, 200);
}

type Item = { id: string; nama: string; jenis: "file" | "folder"; url: string };

/**
 * Baca isi folder Drive publik via embeddedfolderview (HTML, tanpa API key).
 * File tetap di Drive — server cuma parse daftar nama + ID.
 * Folder harus sharing "Anyone with link - Viewer", kalau tidak 403/kosong.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!POLA_ID.test(id))
    return NextResponse.json({ ok: false, pesan: "ID folder tidak valid." }, { status: 400 });
  try {
    const ctl = new AbortController();
    const bunuh = setTimeout(() => ctl.abort(), 10_000);
    const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}#list`, {
      signal: ctl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
    }).finally(() => clearTimeout(bunuh));
    if (res.status === 403 || res.status === 401)
      return NextResponse.json(
        { ok: false, pesan: "403 — ubah sharing folder jadi “Anyone with link – Viewer”.", items: [] },
        { status: 200 }
      );
    if (!res.ok)
      return NextResponse.json(
        { ok: false, pesan: `Drive jawab ${res.status}. Cek link / koneksi.`, items: [] },
        { status: 200 }
      );
    const html = await res.text();
    const temu = new Map<string, Item>();
    // 1) jangkar <a href="...file/d/ID...">Nama</a> / folders/ID
    const polaA = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = polaA.exec(html)) !== null && temu.size < MAKS) {
      const href = dekodeEntitas(m[1]);
      let fid = "";
      let jenis: Item["jenis"] | null = null;
      let mm = /\/(?:file|open)\/d\/([A-Za-z0-9_-]{10,})/.exec(href);
      if (mm) {
        fid = mm[1];
        jenis = "file";
      } else if (/drive\.google\.com\/drive\/folders\//.test(href)) {
        mm = /folders\/([A-Za-z0-9_-]{10,})/.exec(href);
        if (mm) {
          fid = mm[1];
          jenis = "folder";
        }
      } else {
        try {
          const u = new URL(href, "https://drive.google.com");
          const q = u.searchParams.get("id") ?? "";
          if (POLA_ID.test(q)) {
            fid = q;
            jenis = u.pathname.startsWith("/open") || u.pathname.startsWith("/uc") ? "file" : "folder";
          }
        } catch {
          /* abaikan */
        }
      }
      if (!fid || !jenis || fid === id || temu.has(fid)) continue;
      const nama = kupasTag(m[2]);
      if (!nama || /drive|google|my drive/i.test(nama) && nama.length < 8) continue;
      temu.set(fid, {
        id: fid,
        nama,
        jenis,
        url:
          jenis === "folder"
            ? `https://drive.google.com/drive/folders/${fid}`
            : `https://drive.google.com/file/d/${fid}/view`,
      });
    }
    // 2) fallback: pola JS ["ID","Nama"] bila markup jangkar minim
    if (temu.size === 0) {
      const polaJ = /\["([A-Za-z0-9_-]{10,})","([^"]{1,200})"/g;
      while ((m = polaJ.exec(html)) !== null && temu.size < MAKS) {
        const fid = m[1];
        const nama = dekodeEntitas(m[2]);
        if (fid === id || temu.has(fid) || !nama || nama.startsWith("http")) continue;
        temu.set(fid, {
          id: fid,
          nama: nama.slice(0, 200),
          jenis: "file",
          url: `https://drive.google.com/file/d/${fid}/view`,
        });
      }
    }
    return NextResponse.json({ ok: true, items: [...temu.values()].slice(0, MAKS) });
  } catch {
    return NextResponse.json(
      { ok: false, pesan: "Gagal menghubungi Drive. Coba muat ulang.", items: [] },
      { status: 200 }
    );
  }
}
