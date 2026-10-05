import { differenceInCalendarDays } from "date-fns";
import type { Matkul, Tugas } from "./data";

export interface RingkasanInput {
  tugas: Tugas[];
  matkul: Matkul[];
}

export function ringkasLokal({ tugas, matkul }: RingkasanInput): string {
  const aktif = tugas.filter((t) => t.status === "resmi");
  const now = new Date();
  const dlm = (t: Tugas) => differenceInCalendarDays(new Date(t.deadline), now);
  const nama = (id: string) => matkul.find((m) => m.id === id)?.nama ?? "Tanpa matkul";

  if (!aktif.length)
    return "Papan bersih. Tidak ada tugas resmi yang belum selesai — waktu yang tepat untuk mencicil materi HSK atau merapikan catatan.";

  const mendesak = aktif.filter((t) => dlm(t) <= 3).sort((a, b) => dlm(a) - dlm(b));
  const mingguIni = aktif.filter((t) => dlm(t) >= 0 && dlm(t) <= 7);
  const mingguDepan = aktif.filter((t) => dlm(t) >= 8 && dlm(t) <= 14);
  const telat = aktif.filter((t) => dlm(t) < 0);

  // hari tersibuk 7 hari ke depan
  const perHari = new Map<string, number>();
  mingguIni.forEach((t) => {
    const k = new Date(t.deadline).toLocaleDateString("id-ID", { weekday: "long" });
    perHari.set(k, (perHari.get(k) ?? 0) + 1);
  });
  const tersibuk = [...perHari.entries()].sort((a, b) => b[1] - a[1])[0];

  const baris: string[] = [];
  if (telat.length)
    baris.push(
      `Ada ${telat.length} tugas lewat deadline (${telat.map((t) => t.judul).join("; ")}). Selesaikan atau konfirmasi ke PJ hari ini.`
    );
  baris.push(
    `Minggu ini: ${mingguIni.length} deadline${tersibuk ? `, paling padat hari ${tersibuk[0]} (${tersibuk[1]} tugas)` : ""}.`
  );
  if (mendesak.length)
    baris.push(
      `Prioritas utama: ${mendesak.slice(0, 3).map((t) => `${t.judul} — ${nama(t.matkulId)}`).join(" | ")}.`
    );
  baris.push(
    `Minggu depan: ${mingguDepan.length} deadline. Cicil dari sekarang: ${mingguDepan
      .slice(0, 2)
      .map((t) => t.judul)
      .join(", ") || "—"}.`
  );
  return baris.join("\n\n");
}

export async function ringkasGemini(input: RingkasanInput): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "Kamu asisten kelas Offering B(EST) PBM. Buat rangkuman tugas mingguan Bahasa Indonesia santai tapi rapi, maksimal 200 kata, format 3 paragraf pendek: minggu ini, minggu depan, saran prioritas. Tanpa emoji.",
              },
            ],
          },
          contents: [{ parts: [{ text: JSON.stringify(input.tugas) }] }],
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
    return text || null;
  } catch {
    return null;
  }
}
