/**
 * Seed 33 akun Offering B(EST) PBM ke Supabase Auth + profiles.
 *
 * Cara pakai (sekali saja, dari laptop admin):
 *   1. Isi .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   2. node scripts/seed-auth.mjs
 *
 * Email: <NIM>@siswa.tongban.id (admin: email asli). Password = NIM.
 * Aman dijalankan ulang — user yang sudah ada dilewati (diupdate passwordnya).
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// muat .env.local minimalis (tanpa dependensi dotenv)
try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const baris of raw.split("\n")) {
    const m = baris.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  console.error("❌ .env.local tidak ditemukan. Salin dari .env.example dulu.");
  process.exit(1);
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SRV) {
  console.error("❌ Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  process.exit(1);
}

// 33 data kelas: [NIM, NAMA]
const KELAS = [
  ["260242648513", "ADINDA FAIZATUL AISYAH"],
  ["260242649243", "AFIFA SHEILA DEWI"],
  ["260242647182", "AMALIA FAUZA BIL JANNAH"],
  ["260242648537", "ANANDA PUTRI ARDITA"],
  ["260242655645", "DIYA AYU ECLYN MUSTIKA WATI"],
  ["260242648490", "ELSA DEALOVA NOVIANDARA"],
  ["260242652576", "EUNIKE LOUISA WIRANTI RAHARJO"],
  ["260242657610", "GALUH RIHHADATUL AISYAH"],
  ["260242656937", "GRACILLIA DIERA RAMADHINI"],
  ["260242653039", "JEREMY BRIAN CHRISTIAN"],
  ["260242648298", "MA'IDATUL FARIDA"],
  ["260242657041", "MAYVITA OLIVIA DWI ARYANI"],
  ["260242656785", "META LINNA PISQI SIAGIAN"],
  ["260242651282", "METANOIA XHEZYA GUNAWAN"],
  ["260242652932", "MEYFLOURA PUJA SYAHBELLA"],
  ["260242649788", "MUHAMMAD ARIEL FATHONI"],
  ["260242649033", "MUHAMMAD RADITYA FATHURROHMAN"],
  ["260242648613", "NASYIFA QURROTA A'YUN AZAHRA"],
  ["260242658325", "NATASHA GRACIELLA PUTRI EFENDI"],
  ["260242648546", "PUTRI FATIMATUS ZAHRO"],
  ["260242649014", "PUTRY NAWA LOKA EKA SAPTA"],
  ["260242658290", "RACHEL AUSTIN HAKIM"],
  ["260242652775", "RADEN AYU NIMAS SYAMSIATUL QOLBIYAH"],
  ["260242649316", "RANGGA DWITYO SURYA PRANATA"],
  ["260242657427", "RIZZA YUSTINNA SETYANINGRUM"],
  ["260242648171", "ROBI'ATUL MAULIDA"],
  ["260242650182", "ROCHAIFI DINA ABDILLAH"],
  ["260242648580", "SAYNA SIFA"],
  ["260242654999", "SHAFFA AURARIA BIDADARI KAMILA"],
  ["260242648965", "SHENNA ADITYAS"],
  ["260242652538", "SITI SAHILLAH RAKHMA UKHTA ZAKIYAH"],
  ["260242652077", "SYAVIRA ROUDHOTUL JANNAH"],
  ["260242652303", "ZAFAR SODIK"],
];
const ADMIN_NIM = "260242649788";
const ADMIN_EMAIL = "muhammadarielfathoni12@gmail.com";

const rapi = (s) =>
  s.toLowerCase().split(/\s+/).map((k) => (k ? k[0].toUpperCase() + k.slice(1) : k)).join(" ");

const sb = createClient(URL, SRV, { auth: { persistSession: false } });

let baru = 0, sudah = 0, gagal = 0;
for (const [nim, nama] of KELAS) {
  const email = nim === ADMIN_NIM ? ADMIN_EMAIL : `${nim}@siswa.tongban.id`;
  const role = nim === ADMIN_NIM ? "admin" : "member";
  try {
    // cari dulu biar idempotent
    const { data: daftar } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const ada = (daftar?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    let uid;
    if (ada) {
      uid = ada.id;
      await sb.auth.admin.updateUserById(uid, { password: nim, email_confirm: true });
      sudah++;
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email,
        password: nim,
        email_confirm: true,
        user_metadata: { nama: rapi(nama), nim },
      });
      if (error) throw error;
      uid = data.user.id;
      baru++;
    }
    const { error: pErr } = await sb.from("profiles").upsert(
      { id: uid, nama: rapi(nama), nim, email, role },
      { onConflict: "id" }
    );
    if (pErr) throw pErr;
    console.log(`✓ ${rapi(nama)} (${nim}) → ${role}`);
  } catch (e) {
    gagal++;
    console.error(`✗ ${nama}: ${e.message}`);
  }
}
console.log(`\nSelesai: ${baru} baru, ${sudah} sudah-ada, ${gagal} gagal.`);
