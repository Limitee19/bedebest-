import 'package:intl/intl.dart';

const hariId = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

String namaHariIni() {
  final en = DateFormat('EEEE', 'en_US').format(DateTime.now());
  const map = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa',
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat',
    'Saturday': 'Sabtu',
    'Sunday': 'Minggu',
  };
  return map[en] ?? en;
}

String fmtJam(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

String selisihRamah(Duration d) {
  final mnt = d.inMinutes;
  if (mnt < 1) return 'sebentar lagi';
  if (mnt < 60) return '$mnt menit lagi';
  final jam = mnt ~/ 60;
  final sisa = mnt % 60;
  if (sisa == 0) return '$jam jam lagi';
  return '$jam jam $sisa mnt lagi';
}

/// Satu sesi kuliah dengan jam mulai + selesai terurai.
class SesiKelas {
  final String matkul;
  final List<String> dosen;
  final String jam;
  final String ruang;
  final DateTime mulai;
  final DateTime selesai;
  const SesiKelas({
    required this.matkul,
    required this.dosen,
    required this.jam,
    required this.ruang,
    required this.mulai,
    required this.selesai,
  });

  String get dosenPendek => dosen.isEmpty ? '' : dosen.join(' · ');
}

/// Urai "07:00 - 09:35" / "07:00–09:35" / "07.00" jadi (mulai, selesai).
(DateTime?, DateTime?) parseRentang(String jam, DateTime hari) {
  final cocok =
      RegExp(r'(\d{1,2})[:.](\d{2})').allMatches(jam).toList();
  if (cocok.isEmpty) return (null, null);
  DateTime buat(int i) {
    final h = int.parse(cocok[i].group(1)!);
    final m = int.parse(cocok[i].group(2)!);
    return DateTime(hari.year, hari.month, hari.day, h, m);
  }

  final mulai = buat(0);
  DateTime selesai;
  if (cocok.length >= 2) {
    selesai = buat(1);
    if (selesai.isBefore(mulai)) {
      selesai = selesai.add(const Duration(days: 1));
    }
  } else {
    selesai = mulai.add(const Duration(minutes: 100));
  }
  return (mulai, selesai);
}

Map<String, dynamic> _sebagaiMap(dynamic v) {
  if (v is Map<String, dynamic>) return v;
  if (v is Map) return Map<String, dynamic>.from(v);
  return {};
}

/// Semua sesi hari ini, urut jam mulai. Cocok persis nama hari.
List<SesiKelas> sesiHariIniDetail(
  List<Map<String, dynamic>> matkul, {
  DateTime? sekarang,
}) {
  final now = sekarang ?? DateTime.now();
  final hari = namaHariIni().toLowerCase();
  final out = <SesiKelas>[];
  for (final mentah in matkul) {
    final m = _sebagaiMap(mentah);
    final nama = m['nama']?.toString() ?? '';
    final dMentah = m['dosen'];
    final dosen = dMentah is List
        ? dMentah.map((e) => '$e').where((e) => e.isNotEmpty).toList()
        : <String>[];
    final jadwal = m['jadwal'];
    final list = jadwal is List ? jadwal : <dynamic>[];
    for (final sMentah in list) {
      final s = _sebagaiMap(sMentah);
      final h = '${s['hari'] ?? ''}'.toLowerCase().trim();
      if (h != hari) continue;
      final jam = '${s['jam'] ?? ''}';
      final ruang = '${s['ruang'] ?? ''}';
      final (mulai, selesai) = parseRentang(jam, now);
      if (mulai == null || selesai == null) continue;
      out.add(SesiKelas(
        matkul: nama,
        dosen: dosen,
        jam: jam,
        ruang: ruang,
        mulai: mulai,
        selesai: selesai,
      ));
    }
  }
  out.sort((a, b) => a.mulai.compareTo(b.mulai));
  return out;
}

/// Status fokus widget: hanya 1 matkul yang relevan saat ini.
class Fokus {
  final String status;
  final String matkul;
  final String detail;
  final String sub;
  const Fokus(this.status, this.matkul, this.detail, this.sub);
}

Fokus fokusHariIni(List<SesiKelas> sesi, {DateTime? sekarang}) {
  final now = sekarang ?? DateTime.now();
  if (sesi.isEmpty) {
    return Fokus(
      'LIBUR',
      'Tidak ada kelas',
      'Hari ini tidak ada jadwal. Rebahan yang rajin ya.',
      namaHariIni(),
    );
  }
  final kelar = sesi.where((s) => now.isAfter(s.selesai)).length;
  if (kelar >= sesi.length) {
    final n = sesi.length;
    return Fokus(
      'KELAR',
      '$n matkul sudah kelar hari ini',
      'Semua kelas ${namaHariIni()} selesai. Kerja bagus!',
      sesi.map((s) => s.matkul).take(2).join(' · '),
    );
  }
  // Sedang berlangsung (bila tumpang tindih, ambil yang paling awal mulai).
  for (final s in sesi) {
    if (!now.isBefore(s.mulai) && !now.isAfter(s.selesai)) {
      final sisa = s.selesai.difference(now).inMinutes;
      final d = s.dosenPendek.isEmpty ? '' : '${s.dosenPendek} · ';
      return Fokus(
        'SEDANG BERLANGSUNG',
        s.matkul,
        '$d${s.jam} @ ${s.ruang}',
        'Selesai ${fmtJam(s.selesai)} · $sisa mnt lagi',
      );
    }
  }
  // Berikutnya: sesi pertama yang belum mulai.
  for (final s in sesi) {
    if (now.isBefore(s.mulai)) {
      final beda = s.mulai.difference(now);
      final mnt = beda.inMinutes;
      final status = mnt <= 60
          ? 'DIMULAI DALAM $mnt MENIT'
          : 'BERIKUTNYA · ${fmtJam(s.mulai)}';
      final d = s.dosenPendek.isEmpty ? '' : '${s.dosenPendek} · ';
      final sub =
          '${selisihRamah(beda)} · ${s.jam} @ ${s.ruang}${kelar > 0 ? ' · $kelar/${sesi.length} kelar' : ''}';
      return Fokus(status, s.matkul, '$d${s.jam} @ ${s.ruang}', sub);
    }
  }
  final n = sesi.length;
  return Fokus('KELAR', '$n matkul sudah kelar hari ini',
      'Semua kelas selesai.', namaHariIni());
}

// ---- Kompat lama (dipakai test + fallback) ----

class Sesi {
  final String matkul;
  final String jam;
  final String ruang;
  const Sesi(this.matkul, this.jam, this.ruang);
}

List<Sesi> sesiHariIni(List<Map<String, dynamic>> matkul) {
  return sesiHariIniDetail(matkul)
      .map((s) => Sesi(s.matkul, s.jam, s.ruang))
      .toList();
}

class TugasIngat {
  final String judul;
  final String matkul;
  final int sisa;
  const TugasIngat(this.judul, this.matkul, this.sisa);
}

int sisaHari(String iso) {
  try {
    final d = DateTime.parse(iso);
    final now = DateTime.now();
    return DateTime(d.year, d.month, d.day)
        .difference(DateTime(now.year, now.month, now.day))
        .inDays;
  } catch (_) {
    return 99;
  }
}

String _str(dynamic m, String a, String b) {
  if (m is! Map) return '';
  final v = (m[a] ?? m[b] ?? '').toString();
  return v;
}

List<TugasIngat> ingatDeadline(
  List<Map<String, dynamic>> tugas,
  Map<String, String> namaMatkul,
  String uid,
) {
  final out = <TugasIngat>[];
  for (final mentah in tugas) {
    final t = _sebagaiMap(mentah);
    if ('${t['status'] ?? ''}' != 'resmi') continue;
    if ('${t['arsip'] ?? ''}' == 'true') continue;
    final selesai = t['selesai_oleh'] ?? t['selesaiOleh'];
    if (selesai is List && selesai.map((e) => '$e').contains(uid)) continue;
    final sisa = sisaHari(_str(t, 'deadline_at', 'deadline'));
    if (sisa < 0 || sisa > 3) continue;
    final mid = _str(t, 'matkul_id', 'matkulId');
    out.add(TugasIngat(
      '${t['judul'] ?? ''}',
      namaMatkul[mid] ?? '',
      sisa,
    ));
  }
  out.sort((a, b) => a.sisa.compareTo(b.sisa));
  return out;
}

DateTime? jamMulai(String jam) {
  final (mulai, _) = parseRentang(jam, DateTime.now());
  return mulai;
}
