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

class Sesi {
  final String matkul;
  final String jam;
  final String ruang;
  const Sesi(this.matkul, this.jam, this.ruang);
}

List<Sesi> sesiHariIni(List<Map<String, dynamic>> matkul) {
  final hari = namaHariIni().toLowerCase();
  final out = <Sesi>[];
  for (final m in matkul) {
    final nama = (m['nama'] ?? '').toString();
    final jadwal = m['jadwal'];
    final list = jadwal is List ? jadwal : <dynamic>[];
    for (final s in list) {
      if (s is! Map) continue;
      final h = (s['hari'] ?? '').toString().toLowerCase().trim();
      if (h != hari) continue;
      out.add(Sesi(nama, (s['jam'] ?? '').toString(), (s['ruang'] ?? '').toString()));
    }
  }
  return out;
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
    return DateTime(d.year, d.month, d.day).difference(DateTime(now.year, now.month, now.day)).inDays;
  } catch (_) {
    return 99;
  }
}

List<TugasIngat> ingatDeadline(
  List<Map<String, dynamic>> tugas,
  Map<String, String> namaMatkul,
  String uid,
) {
  final out = <TugasIngat>[];
  for (final t in tugas) {
    if ((t['status'] ?? '') != 'resmi') continue;
    final selesai = t['selesai_oleh'];
    if (selesai is List && selesai.map((e) => '$e').contains(uid)) continue;
    final sisa = sisaHari((t['deadline_at'] ?? '').toString());
    if (sisa < 0 || sisa > 3) continue;
    final mid = (t['matkul_id'] ?? '').toString();
    out.add(TugasIngat(
      (t['judul'] ?? '').toString(),
      namaMatkul[mid] ?? '',
      sisa,
    ));
  }
  out.sort((a, b) => a.sisa.compareTo(b.sisa));
  return out;
}

DateTime? jamMulai(String jam) {
  final m = RegExp(r'(\d{1,2})[:.](\d{2})').firstMatch(jam);
  if (m == null) return null;
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day, int.parse(m.group(1)!), int.parse(m.group(2)!));
}
