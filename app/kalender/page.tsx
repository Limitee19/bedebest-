"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, PencilLine, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  LABEL_OVERRIDE,
  dalamSemester,
  matkulTerlihat,
  sesiPadaTanggal,
  tugasTerlihat,
  type TipeOverride,
} from "@/lib/data";
import { Shell } from "@/components/shell";
import { SectionTitle } from "@/components/bits";
import { ConfirmModal } from "@/components/confirm";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const HARI_PENDEK = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];
const NAMA_HARI_JS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function kunci(t: Date) {
  return format(t, "yyyy-MM-dd");
}

export default function KalenderPage() {
  const { user, matkul, tugas, semester, overrides, simpanOverride, hapusOverride, bolehAturJadwal, notify } =
    useStore();
  const [mode, setMode] = useState<"bulan" | "pekan">("bulan");
  const [bulan, setBulan] = useState(() => startOfMonth(new Date()));
  const [pilih, setPilih] = useState<string | null>(null);

  const matkulSaya = useMemo(() => matkul.filter((m) => matkulTerlihat(m, user)), [matkul, user]);
  const tugasSaya = useMemo(
    () => tugasTerlihat(tugas, matkul, user).filter((t) => t.status === "resmi" && !t.arsip),
    [tugas, matkul, user]
  );

  const selBulan = useMemo(() => {
    const awal = startOfWeek(startOfMonth(bulan), { weekStartsOn: 1 });
    const akhir = endOfWeek(endOfMonth(bulan), { weekStartsOn: 1 });
    const arr: Date[] = [];
    for (let d = awal; d <= akhir; d = addDays(d, 1)) arr.push(d);
    return arr;
  }, [bulan]);

  const senin = startOfWeek(new Date(), { weekStartsOn: 1 });
  const pekan = HARI.map((h, i) => ({ nama: h, tanggal: addDays(senin, i) }));
  const hariIni = kunci(new Date());

  function infoSel(tgl: Date) {
    const k = kunci(tgl);
    const namaHari = NAMA_HARI_JS[tgl.getDay()];
    const { biasa, tambahan, libur, ovHari, dipindah } = sesiPadaTanggal(matkulSaya, overrides, tgl, namaHari);
    const dl = tugasSaya.filter((t) => format(new Date(t.deadline), "yyyy-MM-dd") === k);
    const diLuar = !dalamSemester(k, semester);
    return { k, kunci: k, biasa, tambahan, dl, libur, ovHari, dipindah, diLuar, namaHari };
  }

  const pilihTgl = pilih ? new Date(`${pilih}T12:00:00`) : null;
  const pilihInfo = pilihTgl ? infoSel(pilihTgl) : null;

  return (
    <Shell>
      <SectionTitle
        no={<CalendarDays size={22} />}
        title="Kalender Kelas"
        desc={`${semester.label} · ${format(new Date(`${semester.mulai}T12:00:00`), "d MMM", { locale: id })} – ${format(new Date(`${semester.selesai}T12:00:00`), "d MMM yyyy", { locale: id })} · klik tanggal untuk detail.`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border-2 border-(--color-line) bg-(--color-card) p-1">
          {(["bulan", "pekan"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-extrabold uppercase tracking-widest ${
                mode === m ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]" : "text-(--color-soft)"
              }`}
            >
              {m === "bulan" ? "Bulan" : "Pekan"}
            </button>
          ))}
        </div>
        {mode === "bulan" && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setBulan((b) => subMonths(b, 1))}
              title="Bulan lalu"
              className="rounded-full border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-cream)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setBulan(startOfMonth(new Date()))}
              className="rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-1.5 text-[13px] font-extrabold"
            >
              {format(bulan, "MMMM yyyy", { locale: id })}
            </button>
            <button
              onClick={() => setBulan((b) => addMonths(b, 1))}
              title="Bulan depan"
              className="rounded-full border-2 border-(--color-line) bg-(--color-card) p-2 hover:bg-(--color-cream)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {mode === "bulan" ? (
        <div className="paper-card overflow-hidden p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1">
            {HARI_PENDEK.map((h) => (
              <p
                key={h}
                className="py-1 text-center text-[11px] font-extrabold uppercase tracking-widest text-(--color-faint)"
              >
                {h}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {selBulan.map((tgl) => {
              const { k, biasa, tambahan, dl, libur, dipindah, diLuar } = infoSel(tgl);
              const semua = [...biasa, ...tambahan];
              const lainBulan = tgl.getMonth() !== bulan.getMonth();
              const isHariIni = k === hariIni;
              const adaLibur = libur.size > 0;
              return (
                <button
                  key={k}
                  onClick={() => setPilih(k)}
                  className={`flex min-h-[64px] flex-col items-stretch gap-0.5 rounded-xl border-2 p-1 text-left transition-all sm:min-h-[92px] sm:p-1.5 ${
                    isHariIni
                      ? "border-(--color-ink) bg-(--color-cream)"
                      : lainBulan
                        ? "border-transparent opacity-45"
                        : "border-transparent hover:border-(--color-line) hover:bg-(--color-cream)"
                  } ${diLuar ? "bg-black/[0.03]" : ""} ${adaLibur && !diLuar ? "!bg-(--color-apel-soft)/60" : ""}`}
                >
                  <span
                    className={`tnum mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-extrabold sm:text-[13px] ${
                      isHariIni
                        ? "bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                        : "text-(--color-soft)"
                    }`}
                  >
                    {tgl.getDate()}
                  </span>
                  <span className="mt-0.5 flex flex-col gap-0.5">
                    {diLuar ? (
                      <span className="truncate text-center text-[9px] font-bold text-(--color-faint)">
                        luar semester
                      </span>
                    ) : (
                      <>
                        {semua.slice(0, 2).map(({ m, j, ov }, i) => (
                          <span
                            key={`${m.id}-${i}`}
                            className="flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-[9px] font-extrabold leading-tight sm:text-[10px]"
                            style={{ background: `${m.warna}26`, color: "var(--color-ink)" }}
                            title={`${m.nama} · ${j.jam} · ${j.ruang}`}
                          >
                            <span className="h-2.5 w-1 shrink-0 rounded-full sm:h-3" style={{ background: m.warna }} />
                            <span className="truncate">
                              {m.nama.split(" ").slice(0, 2).join(" ")}{ov && ov.tipe !== "pengganti" ? ` · ${LABEL_OVERRIDE[ov.tipe]}` : ""}
                            </span>
                          </span>
                        ))}
                        {semua.length > 2 && (
                          <span className="text-center text-[9px] font-extrabold text-(--color-faint)">
                            +{semua.length - 2} lagi
                          </span>
                        )}
                        {dl.length > 0 && (
                          <span className="truncate rounded-md bg-(--color-apel) px-1 py-0.5 text-center text-[9px] font-extrabold text-white">
                            KUMPUL {dl.length}
                          </span>
                        )}
                        {adaLibur && (
                          <span className="truncate text-center text-[9px] font-extrabold text-(--color-apel)">
                            LIBUR
                          </span>
                        )}
                        {dipindah.length > 0 && (
                          <span className="truncate rounded-md bg-(--color-lemon-soft) px-1 py-0.5 text-center text-[9px] font-extrabold text-(--color-lemon)">
                            PINDAH → {format(new Date(`${dipindah[0].ov.tanggal}T12:00:00`), "d MMM", { locale: id })}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="px-2 pb-1 pt-2 text-[12px] font-bold text-(--color-faint)">
            Strip warna = warna matkul · merah muda = ada yang libur · KUMPUL = deadline tugas resmi.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pekan.map((h) => {
            const { k, biasa, tambahan, dl, libur, dipindah, diLuar } = infoSel(h.tanggal);
            const semua = [...biasa, ...tambahan];
            const isHariIni = k === hariIni;
            return (
              <article
                key={h.nama}
                onClick={() => setPilih(k)}
                className={`paper-card cursor-pointer p-4 ${isHariIni ? "border-2 border-(--color-ink)" : ""} ${libur.size ? "!bg-(--color-apel-soft)/40" : ""}`}
              >
                <header className="flex items-baseline justify-between border-b-2 border-dashed border-(--color-line) pb-2">
                  <h3 className="font-display text-[20px] font-bold">{h.nama}</h3>
                  <span className="tnum text-[13px] font-bold text-(--color-faint)">
                    {format(h.tanggal, "d MMM", { locale: id })}
                    {isHariIni && <b className="sticker ml-1.5 bg-(--color-apel-soft) px-2 py-0.5 text-[10px] text-(--color-apel)">HARI INI</b>}
                  </span>
                </header>
                <div className="mt-2.5 flex flex-col gap-2">
                  {diLuar && (
                    <p className="py-2 text-center text-[13px] font-bold text-(--color-faint)">Di luar {semester.label}</p>
                  )}
                  {!diLuar && semua.map(({ m, j, ov }, i) => (
                    <div key={`${m.id}-${i}`} className="flex items-center gap-2.5 rounded-2xl bg-(--color-cream) px-3 py-2 text-[14px]">
                      <span className="h-7 w-2 shrink-0 rounded-full" style={{ background: m.warna }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold">{m.nama}</span>
                        <span className="block text-[12px] font-bold text-(--color-soft)">
                          {j.jam} · {j.ruang}
                          {ov && <b className="ml-1 text-(--color-apel)">· {LABEL_OVERRIDE[ov.tipe]}</b>}
                        </span>
                      </span>
                    </div>
                  ))}
                  {!diLuar && [...libur.values()].map((o) => {
                    const m = matkulSaya.find((x) => x.id === o.matkulId);
                    return (
                      <div key={o.id} className="rounded-2xl bg-(--color-apel-soft) px-3 py-2 text-[13px] font-bold text-(--color-apel)">
                        {m?.nama ?? "Kelas"} libur{o.keterangan ? ` — ${o.keterangan}` : ""}
                      </div>
                    );
                  })}
                  {!diLuar && dipindah.map(({ m, ov }) => (
                    <div key={ov.id} className="rounded-2xl border-2 border-dashed border-(--color-lemon) bg-(--color-lemon-soft) px-3 py-2 text-[13px] font-bold">
                      {m.nama} dipindah → {format(new Date(`${ov.tanggal}T12:00:00`), "d MMM", { locale: id })}
                    </div>
                  ))}
                  {dl.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-2xl bg-(--color-apel-soft) px-3 py-2 text-[14px]">
                      <span className="rounded-full bg-(--color-apel) px-2 py-0.5 text-[10px] font-extrabold text-white">KUMPUL</span>
                      <span className="font-extrabold">{t.judul}</span>
                    </div>
                  ))}
                  {!semua.length && !dl.length && !diLuar && (
                    <p className="py-3 text-center text-[14px] font-medium text-(--color-faint)">Hari bebas, waktunya rebahan~</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pilih && pilihTgl && pilihInfo && (
        <DrawerHari
          tanggal={pilihTgl}
          info={pilihInfo}
          onTutup={() => setPilih(null)}
          simpanOverride={simpanOverride}
          hapusOverride={hapusOverride}
          bolehAturJadwal={bolehAturJadwal}
          notify={notify}
        />
      )}
    </Shell>
  );
}

function DrawerHari({
  tanggal,
  info,
  onTutup,
  simpanOverride,
  hapusOverride,
  bolehAturJadwal,
  notify,
}: {
  tanggal: Date;
  info: ReturnType<typeof sesiPadaTanggal> & {
    dl: { id: string; judul: string; matkulId: string }[];
    diLuar: boolean;
  };
  onTutup: () => void;
  simpanOverride: (i: { matkulId: string; tanggal: string; asal?: string; tipe: TipeOverride; jam?: string; ruang?: string; keterangan?: string }) => string | null;
  hapusOverride: (id: string) => void;
  bolehAturJadwal: (id: string) => boolean;
  notify: (t: string, j?: "ok" | "gagal") => void;
}) {
  const { matkul, user } = useStore();
  const [formBuka, setFormBuka] = useState(false);
  const [fMk, setFMk] = useState("");
  const [fTipe, setFTipe] = useState<TipeOverride>("libur");
  const [fTgl, setFTgl] = useState("");
  const [fAsal, setFAsal] = useState("");
  const [fJam, setFJam] = useState("");
  const [fRuang, setFRuang] = useState("");
  const [fKet, setFKet] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tanyaId, setTanyaId] = useState<string | null>(null);
  const k = format(tanggal, "yyyy-MM-dd");
  const semua = [...info.biasa, ...info.tambahan];
  // Bisa pilih SEMUA matkul yang berhak diatur (bukan cuma yang ada hari itu).
  const kandidat = matkul.filter((m) => matkulTerlihat(m, user) && bolehAturJadwal(m.id));
  // Default: matkul yang ada pada hari yang diklik (biar Selasa langsung kepilih Seni+CC1).
  const defaultIds = [...new Set(semua.map((s) => s.m.id))];

  function bukaForm() {
    setErr(null);
    setFTgl(k);
    setFAsal(fTipe === "pengganti" ? k : "");
    // default ke matkul hari ini bila ada, kalau tidak ke kandidat pertama
    const awal = defaultIds[0] ?? kandidat[0]?.id ?? "";
    setFMk(awal);
    // prefill jam/ruang dari sesi hari ini bila matkulnya ada di hari itu
    const sesiAwal = semua.find((s) => s.m.id === awal);
    setFJam(sesiAwal?.j.jam ?? "");
    setFRuang(sesiAwal?.j.ruang ?? "");
    setFormBuka(true);
  }

  function pilihMk(idMk: string) {
    setFMk(idMk);
    // ganti prefill mengikuti matkul yang dipilih
    const sesi = semua.find((s) => s.m.id === idMk);
    if (sesi) {
      if (!fJam) setFJam(sesi.j.jam);
      if (!fRuang) setFRuang(sesi.j.ruang);
    }
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!fMk) {
      setErr("Pilih matkul dulu.");
      return;
    }
    const tglSimpan = fTgl || k;
    const gagal = simpanOverride({
      matkulId: fMk,
      tanggal: tglSimpan,
      ...(fTipe === "pengganti" && fAsal ? { asal: fAsal } : {}),
      tipe: fTipe,
      jam: fJam,
      ruang: fRuang,
      keterangan: fKet,
    });
    if (gagal) {
      setErr(gagal);
      return;
    }
    const nm = matkul.find((m) => m.id === fMk)?.nama ?? "Jadwal";
    const tglLabel = format(new Date(`${tglSimpan}T12:00:00`), "d MMM", { locale: id });
    notify(`${LABEL_OVERRIDE[fTipe]} ${nm} ${tglLabel} tersimpan — semua perangkat ikut update.`);
    setFormBuka(false);
    setFJam("");
    setFRuang("");
    setFKet("");
    setFAsal("");
    setErr(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-4" onClick={onTutup}>
      <div
        className="paper-card flex max-h-[92dvh] w-full max-w-md flex-col !rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-[22px] font-bold leading-tight">
              {format(tanggal, "EEEE, d MMM yyyy", { locale: id })}
            </h3>
            <p className="text-[13px] font-medium text-(--color-soft)">
              {semua.length} sesi · {info.dl.length} deadline
              {info.diLuar ? " · di luar semester" : ""}
            </p>
          </div>
          <button
            onClick={onTutup}
            title="Tutup"
            className="rounded-full border-2 border-(--color-line) p-1.5 hover:bg-(--color-cream)"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
          {semua.map(({ m, j, ov }, i) => (
            <div key={`${m.id}-${i}`} className="rounded-2xl bg-(--color-cream) p-3">
              <p className="flex items-center gap-2 text-[14px] font-extrabold">
                <span className="h-3 w-3 rounded-full" style={{ background: m.warna }} />
                <Link href={`/matkul/${m.id}`} className="hover:underline">{m.nama}</Link>
                {ov && (
                  <span className="rounded-full bg-(--color-apel) px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    {LABEL_OVERRIDE[ov.tipe]}
                  </span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[13px] font-bold text-(--color-soft)">
                {j.jam} · <MapPin size={13} /> {j.ruang}
              </p>
              {ov?.keterangan && (
                <p className="mt-1 text-[13px] font-medium text-(--color-soft)">“{ov.keterangan}” — {ov.oleh}</p>
              )}
            </div>
          ))}
          {[...info.libur.values()].map((o) => {
            const m = matkul.find((x) => x.id === o.matkulId);
            return (
              <div key={o.id} className="rounded-2xl bg-(--color-apel-soft) p-3">
                <p className="text-[14px] font-extrabold text-(--color-apel)">
                  {m?.nama ?? "Kelas"} libur
                </p>
                {o.keterangan && <p className="text-[13px] font-medium">“{o.keterangan}” — {o.oleh}</p>}
                {m && bolehAturJadwal(m.id) && (
                  <button
                    onClick={() => setTanyaId(o.id)}
                    className="mt-1.5 flex items-center gap-1 text-[12px] font-extrabold text-(--color-apel) hover:underline"
                  >
                    <Trash2 size={13} /> Batalkan info libur
                  </button>
                )}
              </div>
            );
          })}
          {info.dipindah.map(({ m, ov }) => (
            <div key={ov.id} className="rounded-2xl border-2 border-dashed border-(--color-lemon) bg-(--color-lemon-soft) p-3">
              <p className="text-[14px] font-extrabold">
                {m.nama} dipindah → {format(new Date(`${ov.tanggal}T12:00:00`), "EEEE, d MMM", { locale: id })}
              </p>
              {ov.keterangan && <p className="text-[13px] font-medium">“{ov.keterangan}” — {ov.oleh}</p>}
              {bolehAturJadwal(m.id) && (
                <button
                  onClick={() => setTanyaId(ov.id)}
                  className="mt-1.5 flex items-center gap-1 text-[12px] font-extrabold text-(--color-apel) hover:underline"
                >
                  <Trash2 size={13} /> Batalkan pemindahan
                </button>
              )}
            </div>
          ))}
          {info.ovHari
            .filter((o) => o.tipe !== "libur")
            .map((o) => {
              const m = matkul.find((x) => x.id === o.matkulId);
              if (!m) return null;
              const tampilSesi =
                o.tipe === "pengganti" &&
                semua.some((s) => s.ov?.id === o.id);
              if (tampilSesi) return null;
              return (
                <div key={o.id} className="rounded-2xl bg-(--color-cream) p-3">
                  <p className="text-[14px] font-extrabold">
                    {m.nama} · {LABEL_OVERRIDE[o.tipe]}
                    {o.asal ? ` (dari ${format(new Date(`${o.asal}T12:00:00`), "d MMM", { locale: id })})` : ""}
                  </p>
                  {(o.jam || o.ruang) && (
                    <p className="text-[13px] font-bold text-(--color-soft)">
                      {[o.jam, o.ruang].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {o.keterangan && <p className="text-[13px] font-medium">“{o.keterangan}” — {o.oleh}</p>}
                  {bolehAturJadwal(m.id) && (
                    <button
                      onClick={() => setTanyaId(o.id)}
                      className="mt-1.5 flex items-center gap-1 text-[12px] font-extrabold text-(--color-apel) hover:underline"
                    >
                      <Trash2 size={13} /> Batalkan info
                    </button>
                  )}
                </div>
              );
            })}
          {!semua.length && !info.libur.size && !info.dipindah.length && (
            <p className="rounded-2xl bg-(--color-cream) p-4 text-center text-[14px] font-bold text-(--color-soft)">
              Tidak ada kelas hari ini. Rebahan yang rajin ya.
            </p>
          )}

          <section>
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-(--color-apel)">
              Deadline kumpul ({info.dl.length})
            </p>
            {info.dl.length ? (
              <ul className="mt-1.5 space-y-2">
                {info.dl.map((t) => (
                  <li key={t.id} className="rounded-2xl bg-(--color-apel-soft) p-3">
                    <p className="text-[14px] font-extrabold">{t.judul}</p>
                    <p className="text-[12px] font-bold text-(--color-soft)">
                      {matkul.find((m) => m.id === t.matkulId)?.nama ?? ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 rounded-2xl bg-(--color-daun-soft) p-3 text-[13px] font-bold text-(--color-daun)">
                Tidak ada yang dikumpulkan hari ini. Aman!
              </p>
            )}
          </section>

          {kandidat.length > 0 && !formBuka && (
            <button
              onClick={bukaForm}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-(--color-line) px-4 py-2.5 text-[13px] font-extrabold text-(--color-soft) hover:border-(--color-lemon)"
            >
              <PencilLine size={15} /> Atur jadwal (libur / pengganti / online / pindah)
            </button>
          )}

          {formBuka && (
            <form onSubmit={kirim} className="rounded-2xl bg-(--color-cream) p-3.5">
              <p className="text-[13px] font-extrabold uppercase tracking-widest text-(--color-faint)">
                Info jadwal — dibuka dari {format(tanggal, "d MMM", { locale: id })}
              </p>
              <label className="mt-2 block text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft)">
                Matkul (semua yang kamu kelola, bukan cuma hari ini)
                <select
                  value={fMk}
                  onChange={(e) => pilihMk(e.target.value)}
                  className="field mt-1 w-full px-3 py-2 text-[14px] font-bold outline-none"
                >
                  {defaultIds.length > 0 && (
                    <optgroup label={`Ada hari ini (${format(tanggal, "EEEE", { locale: id })})`}>
                      {defaultIds.map((idMk) => {
                        const mm = matkul.find((x) => x.id === idMk);
                        return mm ? <option key={idMk} value={idMk}>{mm.nama}</option> : null;
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Semua matkul saya">
                    {kandidat.filter((m) => !defaultIds.includes(m.id)).map((m) => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(Object.keys(LABEL_OVERRIDE) as TipeOverride[]).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => {
                      setFTipe(t);
                      if (t === "pengganti" && !fAsal) setFAsal(k);
                    }}
                    className={`rounded-xl border-2 px-3 py-2 text-[13px] font-extrabold ${
                      fTipe === t
                        ? "border-(--color-ink) bg-(--color-ink) text-[#fff6e8] dark:text-[#181222]"
                        : "border-(--color-line) bg-(--color-card)"
                    }`}
                  >
                    {LABEL_OVERRIDE[t]}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid gap-2 min-[400px]:grid-cols-2">
                <label className="text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft)">
                  Berlaku tanggal
                  <input
                    type="date"
                    value={fTgl}
                    onChange={(e) => setFTgl(e.target.value)}
                    className="field mt-1 w-full min-w-0 px-3 py-2 text-[14px] outline-none"
                    required
                  />
                </label>
                {fTipe === "pengganti" && (
                  <label className="text-[12px] font-extrabold uppercase tracking-widest text-(--color-soft)">
                    Pindahan dari (opsional)
                    <input
                      type="date"
                      value={fAsal}
                      onChange={(e) => setFAsal(e.target.value)}
                      className="field mt-1 w-full min-w-0 px-3 py-2 text-[14px] outline-none"
                    />
                  </label>
                )}
              </div>
              {fTipe === "pengganti" && (
                <p className="mt-1 text-[12px] font-bold text-(--color-soft)">
                  Contoh: Selasa 20 Okt → Rabu 14 Okt. Isi berlaku 14 Okt, asal 20 Okt — sesi 20 Okt otomatis hilang sementara.
                </p>
              )}
              {fTipe !== "libur" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={fJam}
                    onChange={(e) => setFJam(e.target.value)}
                    placeholder="Jam, mis. 08:00 – 10:00"
                    className="field min-w-0 px-3 py-2 text-[14px] outline-none"
                  />
                  <input
                    value={fRuang}
                    onChange={(e) => setFRuang(e.target.value)}
                    placeholder="Ruang / link online"
                    className="field min-w-0 px-3 py-2 text-[14px] outline-none"
                  />
                </div>
              )}
              <input
                value={fKet}
                onChange={(e) => setFKet(e.target.value)}
                placeholder="Keterangan, mis. Dosen rapat / pindah ke A1"
                maxLength={500}
                className="field mt-2 w-full px-3 py-2 text-[14px] outline-none"
              />
              {err && <p className="mt-1.5 text-[13px] font-extrabold text-(--color-apel)">{err}</p>}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormBuka(false)}
                  className="rounded-full border-2 border-(--color-line) bg-(--color-card) px-4 py-2 text-[13px] font-extrabold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-hard rounded-full bg-(--color-ink) px-4 py-2 text-[13px] font-extrabold text-[#fff6e8] dark:text-[#181222]"
                >
                  Simpan info
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/tugas"
            className="flex items-center justify-center gap-1.5 rounded-full border-2 border-(--color-line) px-4 py-2.5 text-[13px] font-extrabold"
          >
            <Plus size={15} strokeWidth={3} /> Usulkan tugas
          </Link>
          <button
            onClick={onTutup}
            className="btn-hard rounded-full bg-(--color-daun) px-4 py-2.5 text-[13px] font-extrabold text-white"
          >
            Tutup
          </button>
        </div>
      </div>

      <ConfirmModal
        open={tanyaId !== null}
        bahaya
        judul="Batalkan info ini?"
        pesan="Jadwal kembali normal seperti biasa."
        batalLabel="Batal"
        yaLabel="Ya, batalkan"
        onBatal={() => setTanyaId(null)}
        onYa={() => {
          if (tanyaId) {
            hapusOverride(tanyaId);
            notify("Info jadwal dibatalkan.");
          }
          setTanyaId(null);
        }}
      />
    </div>
  );
}
