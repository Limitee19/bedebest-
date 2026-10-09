import 'package:bedebest/jadwal.dart';
import 'package:flutter_test/flutter_test.dart';

List<Map<String, dynamic>> matkulJumat() => [
      {
        'nama': 'Pemahaman Lintas Budaya',
        'dosen': ['Min Gong'],
        'jadwal': [
          {'hari': 'Jumat', 'jam': '07:00 - 08:40', 'ruang': 'Ruang A20-613 Ged A20'},
        ],
      },
      {
        'nama': 'Kaligrafi Tiongkok',
        'dosen': ['Yingzhen Lin'],
        'jadwal': [
          {'hari': 'Jumat', 'jam': '08:45 - 10:25', 'ruang': 'Ruang A1-103 Ged A1'},
        ],
      },
    ];

DateTime jumat(int h, int m) {
  // Cari Jumat terdekat (pakai tanggal tetap agar deterministik).
  final d = DateTime(2026, 10, 9, h, m); // Jumat
  assert(d.weekday == DateTime.friday);
  return d;
}

void main() {
  test('namaHariIni hasilkan hari Indonesia', () {
    expect(hariId, contains(namaHariIni()));
  });

  test('sisaHari hitung selisih kalender', () {
    final besok = DateTime.now().add(const Duration(days: 1));
    final iso =
        '${besok.year.toString().padLeft(4, '0')}-${besok.month.toString().padLeft(2, '0')}-${besok.day.toString().padLeft(2, '0')}T23:59:00.000';
    expect(sisaHari(iso), 1);
  });

  test('sesiHariIni hanya cocok persis nama hari', () {
    final sesi = sesiHariIni([
      {
        'nama': 'PAI',
        'jadwal': [
          {'hari': namaHariIni(), 'jam': '07:00 - 08:00', 'ruang': 'A1'},
          {'hari': 'TidakAda', 'jam': '09:00', 'ruang': 'A2'},
        ],
      },
    ]);
    expect(sesi.length, 1);
    expect(sesi.first.matkul, 'PAI');
  });

  test('parseRentang urai strip dan titik', () {
    final hari = DateTime(2026, 10, 9);
    final (a, b) = parseRentang('07:00 - 08:40', hari);
    expect(a?.hour, 7);
    expect(b?.hour, 8);
    expect(b?.minute, 40);
    final (c, d) = parseRentang('08.45–10.25', hari);
    expect(c?.hour, 8);
    expect(d?.minute, 25);
  });

  test('fokus: 06:45 Jumat = PLB 15 menit lagi + dosen + ruang', () {
    final sesi = sesiHariIniDetail(matkulJumat(), sekarang: jumat(6, 45));
    expect(sesi.length, 2);
    final f = fokusHariIni(sesi, sekarang: jumat(6, 45));
    expect(f.matkul, 'Pemahaman Lintas Budaya');
    expect(f.status, contains('15 MENIT'));
    expect(f.detail, contains('Min Gong'));
    expect(f.detail, contains('A20-613'));
    // Matkul kedua belum tampil.
    expect(f.matkul.contains('Kaligrafi'), false);
  });

  test('fokus: 08:41 Jumat = Kaligrafi 4 menit lagi', () {
    final sesi = sesiHariIniDetail(matkulJumat(), sekarang: jumat(8, 41));
    final f = fokusHariIni(sesi, sekarang: jumat(8, 41));
    expect(f.matkul, 'Kaligrafi Tiongkok');
    expect(f.status, contains('4 MENIT'));
  });

  test('fokus: tengah sesi = sedang berlangsung', () {
    final sesi = sesiHariIniDetail(matkulJumat(), sekarang: jumat(7, 30));
    final f = fokusHariIni(sesi, sekarang: jumat(7, 30));
    expect(f.status, 'SEDANG BERLANGSUNG');
    expect(f.matkul, 'Pemahaman Lintas Budaya');
  });

  test('fokus: semua kelar = hitung n matkul', () {
    final sesi = sesiHariIniDetail(matkulJumat(), sekarang: jumat(11, 0));
    final f = fokusHariIni(sesi, sekarang: jumat(11, 0));
    expect(f.matkul, contains('2 matkul sudah kelar'));
  });
}
