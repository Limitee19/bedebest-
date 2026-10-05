"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarHeart,
  CheckCircle2,
  ChevronRight,
  Siren,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  jadwalHariIni,
  kunciHariIni,
  namaHariIni,
  pengingatDeadline,
} from "@/lib/notif";

const LS_HARI = "tongban-notif-day";

async function tampilkanNotifikasi(judul: string, isi: string) {
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(judul, {
        body: isi,
        icon: "/logo.svg",
        tag: `tongban-${kunciHariIni()}`,
      });
    } else {
      new Notification(judul, { body: isi, icon: "/logo.svg" });
    }
  } catch {
    /* izin ditolak / tidak didukung — diam saja */
  }
}

/**
 * Tiap 60 detik: kalau sudah ganti hari (melewati 00:00), susun notifikasi
 * pengingat deadline H-3..H-0 + jadwal kuliah hari ini, khusus untuk
 * tugas yang belum diselesaikan user ini.
 */
export function usePengingat() {
  const { user, tugas, matkul } = useStore();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    async function cek() {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const kunci = kunciHariIni();
      let terakhir: string | null = null;
      try {
        terakhir = localStorage.getItem(LS_HARI);
      } catch { /* abaikan */ }
      if (terakhir === kunci) return;
      const ingat = pengingatDeadline(tugas, matkul, user);
      const jadwal = jadwalHariIni(matkul, user);
      if (!ingat.length && !jadwal.length) return;
      const baris: string[] = [];
      if (ingat.length)
        baris.push(
          `${ingat.length} tugas mendekati deadline: ` +
            ingat.slice(0, 2).map((p) => `${p.judul} (H-${p.sisa})`).join(", ") +
            (ingat.length > 2 ? `, +${ingat.length - 2} lagi` : "")
        );
      if (jadwal.length)
        baris.push(
          `Jadwal ${namaHariIni()}: ` +
            jadwal.map(({ m, sesi }) => `${m.nama} ${sesi.jam} @ ${sesi.ruang}`).join(" · ")
        );
      await tampilkanNotifikasi("TóngBǎn mengingatkan", baris.join("\n"));
      try {
        localStorage.setItem(LS_HARI, kunci);
      } catch { /* abaikan */ }
    }
    cek();
    const timer = setInterval(cek, 60_000);
    return () => clearInterval(timer);
  }, [user, tugas, matkul]);
}

export function Bell() {
  const { user } = useStore();
  const { tugas, matkul } = useStore();
  const [buka, setBuka] = useState(false);
  const [izin, setIzin] = useState<string>("default");
  const [pushAktif, setPushAktif] = useState(false);
  const [pushPesan, setPushPesan] = useState<string | null>(null);

  useEffect(() => {
    if (typeof Notification !== "undefined") setIzin(Notification.permission);
    try {
      setPushAktif(localStorage.getItem("tongban-push") === "aktif");
    } catch { /* abaikan */ }
  }, []);

  const ingat = pengingatDeadline(tugas, matkul, user);
  const jadwal = jadwalHariIni(matkul, user);
  const badge = ingat.length;

  /** Konfirmasi 1x: izin browser + daftarkan push agar bunyi walau web tertutup. */
  async function nyalakan() {
    setPushPesan(null);
    try {
      if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushPesan("Peramban ini tidak mendukung push. Coba Chrome/Edge di Android atau desktop.");
        return;
      }
      const hasil = await Notification.requestPermission();
      setIzin(hasil);
      if (hasil !== "granted") {
        setPushPesan("Izin ditolak. Nyalakan lewat pengaturan situs bila berubah pikiran.");
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setPushPesan("Server belum punya VAPID. Mode pengingat lokal tetap jalan saat web dibuka.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const lama = await reg.pushManager.getSubscription();
      const sub =
        lama ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapid }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, subscription: sub.toJSON() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.pesan || "gagal");
      try {
        localStorage.setItem("tongban-push", "aktif");
      } catch { /* abaikan */ }
      setPushAktif(true);
    } catch {
      setPushPesan("Gagal menyalakan push. Coba lagi nanti.");
    }
  }

  return (
    <>
      <button
        onClick={() => setBuka(true)}
        title="Notifikasi"
        className="relative rounded-full border-2 border-(--color-line) bg-(--color-card) p-2 text-(--color-ink) transition-transform hover:-translate-y-0.5"
      >
        <BellRing size={17} />
        {badge > 0 && (
          <span className="font-display absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-apel) px-1 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {buka && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 p-4" onClick={() => setBuka(false)}>
          <div
            className="paper-card flex max-h-full w-full max-w-sm flex-col !rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[22px] font-bold">Notifikasi</h3>
            <p className="text-[13px] font-medium text-(--color-soft)">
              Pengingat harian H-3…H-0 + jadwal 00:00, hanya untuk tugas yang belum
              kamu selesaikan. Cukup izinkan 1x — bunyi walau web tertutup.
            </p>

            <div className="mt-3 flex-1 space-y-4 overflow-y-auto pr-1">
              <section>
                <p className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-widest text-(--color-apel)">
                  <Siren size={14} /> Deadline H-3 sampai H-0
                </p>
                {ingat.length ? (
                  <ul className="mt-1.5 space-y-2">
                    {ingat.map((p) => (
                      <li key={p.id} className="rounded-2xl bg-(--color-apel-soft) p-3">
                        <p className="text-[14px] font-extrabold leading-snug">{p.judul}</p>
                        <p className="mt-0.5 text-[12px] font-bold text-(--color-soft)">
                          {p.matkulNama} · {p.sisa === 0 ? "hari ini!" : p.sisa === 1 ? "besok" : `${p.sisa} hari lagi`}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 rounded-2xl bg-(--color-daun-soft) p-3 text-[13px] font-bold text-(--color-daun)">
                    Aman! Tidak ada deadline mepet yang belum kamu selesaikan.
                  </p>
                )}
              </section>

              <section>
                <p className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-widest text-(--color-sky)">
                  <CalendarHeart size={14} /> Jadwal {namaHariIni()}
                </p>
                {jadwal.length ? (
                  <ul className="mt-1.5 space-y-2">
                    {jadwal.map(({ m, sesi }, i) => (
                      <li key={`${m.id}-${i}`} className="rounded-2xl bg-(--color-cream) p-3">
                        <p className="text-[14px] font-extrabold">{m.nama}</p>
                        <p className="mt-0.5 text-[12px] font-bold text-(--color-soft)">
                          {sesi.jam} · {sesi.ruang}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 rounded-2xl bg-(--color-cream) p-3 text-[13px] font-bold text-(--color-soft)">
                    Hari ini tidak ada jadwal. Rebahan yang rajin ya.
                  </p>
                )}
              </section>
            </div>

            {pushAktif ? (
              <p className="mt-3 rounded-2xl bg-(--color-daun-soft) p-3 text-center text-[13px] font-extrabold text-(--color-daun)">
                Notifikasi HP aktif — walau web tertutup, pengingat harian tetap bunyi.
              </p>
            ) : (
              <button
                onClick={nyalakan}
                className="btn-hard font-display mt-3 w-full rounded-full bg-(--color-apel) px-4 py-2.5 text-[15px] font-bold text-white"
              >
                Nyalakan notif di HP
              </button>
            )}
            {pushPesan && (
              <p className="mt-2 rounded-2xl bg-(--color-lemon-soft) p-3 text-center text-[13px] font-bold text-(--color-soft)">
                {pushPesan}
              </p>
            )}
            {izin === "denied" && !pushAktif && (
              <p className="mt-2 text-center text-[12px] font-bold text-(--color-faint)">
                Izin notifikasi diblokir peramban — aktifkan lewat ikon gembok di address bar.
              </p>
            )}
            <Link
              href="/aktivitas"
              onClick={() => setBuka(false)}
              className="mt-2.5 flex items-center justify-center gap-1 rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[14px] font-extrabold"
            >
              <CheckCircle2 size={16} /> Lihat riwayat kelas <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
