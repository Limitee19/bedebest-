import 'package:bedebest/jadwal.dart';
import 'package:flutter_test/flutter_test.dart';

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
}
