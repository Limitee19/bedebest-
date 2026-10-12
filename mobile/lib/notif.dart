import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'cermin.dart';
import 'jadwal.dart';
import 'supa.dart';

final notif = FlutterLocalNotificationsPlugin();
bool _notifSiap = false;

/// ID alarm: 7 = periodik 15 mnt, 100+ = tepi sesi, 200+ = tick per menit.
const int alarmPeriodikId = 7;
const int _tepiBase = 100;
const int _tickBase = 200;
const int _tickJumlah = 14;

Future<void> siapNotif() async {
  if (_notifSiap) return;
  const android = AndroidInitializationSettings('@mipmap/ic_launcher');
  await notif.initialize(const InitializationSettings(android: android));
  try {
    await notif
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    await notif
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();
  } catch (_) {}
  _notifSiap = true;
}

Future<void> bunyi(String judul, String isi) async {
  try {
    await siapNotif();
    await notif.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      judul,
      isi,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'bedebest-harian',
          'BeDeBest Harian',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
    );
  } catch (_) {}
}

/// 4 slot widget: status (sedang/dimulai/kelar) + matkul + detail + sub.
Future<void> simpanWidget(Fokus f) async {
  try {
    await HomeWidget.saveWidgetData('status', f.status);
    await HomeWidget.saveWidgetData('matkul', f.matkul);
    await HomeWidget.saveWidgetData('detail', f.detail);
    await HomeWidget.saveWidgetData('sub', f.sub);
    await HomeWidget.saveWidgetData('judul', 'BeDeBest · ${f.matkul}');
    await HomeWidget.saveWidgetData('baris', '${f.status}\n${f.detail}\n${f.sub}');
    await HomeWidget.updateWidget(
      androidName: 'BeDeBestWidget',
      qualifiedAndroidName: 'id.bedebest.bedebest.BeDeBestWidget',
    );
  } catch (_) {}
}

Map<String, dynamic> _map(dynamic v) {
  if (v is Map<String, dynamic>) return v;
  if (v is Map) return Map<String, dynamic>.from(v);
  return {};
}

String _s(Map m, List<String> kunci) {
  for (final k in kunci) {
    final v = m[k];
    if (v != null && '$v'.isNotEmpty) return '$v';
  }
  return '';
}

List<Map<String, dynamic>> _normalMatkul(dynamic mk) {
  if (mk is! List) return [];
  return mk.map((e) {
    final m = _map(e);
    return {
      'id': _s(m, ['id']),
      'nama': _s(m, ['nama']),
      'dosen': m['dosen'] ?? m['dosenList'] ?? [],
      'jadwal': m['jadwal'] ?? [],
      'pj_ids': m['pj_ids'] ?? m['pjIds'] ?? [],
      'anggota_ids': m['anggota_ids'] ?? m['anggotaIds'] ?? [],
    };
  }).toList();
}

List<Map<String, dynamic>> _normalTugas(dynamic tg) {
  if (tg is! List) return [];
  return tg.map((e) {
    final t = _map(e);
    return {
      'judul': _s(t, ['judul']),
      'matkul_id': _s(t, ['matkul_id', 'matkulId']),
      'deadline_at': _s(t, ['deadline_at', 'deadline']),
      'status': _s(t, ['status']),
      'selesai_oleh': t['selesai_oleh'] ?? t['selesaiOleh'] ?? [],
      'arsip': t['arsip'] ?? false,
    };
  }).toList();
}

bool _terlihat(Map<String, dynamic> m, String uid, String role) {
  if (role == 'admin') return true;
  final mm = _map(m);
  final pj = (mm['pj_ids'] as List? ?? []).map((e) => '$e');
  if (pj.contains(uid)) return true;
  final ag = (mm['anggota_ids'] as List? ?? []).map((e) => '$e');
  return ag.isEmpty || ag.contains(uid);
}

/// Hitung fokus dari data mentah + simpan widget. Murni lokal, tanpa network.
Future<List<SesiKelas>> _simpanDariData(
  List<Map<String, dynamic>> listMk,
  List<Map<String, dynamic>> listTg,
  String uid,
  String role,
  DateTime now,
) async {
  final boleh = listMk.where((m) => _terlihat(m, uid, role)).toList();
  final sesiHari = sesiHariIniDetail(boleh, sekarang: now);
  final fokus = fokusHariIni(sesiHari, sekarang: now);
  await simpanWidget(fokus);
  return sesiHari;
}

/// Mode ringan: hanya baca Cermin (SharedPreferences), tanpa Supabase.
/// Dipakai tick per menit + alarm tepi agar widget jalan walau app mati.
Future<void> segarkanWidgetRingan({DateTime? sekarang}) async {
  try {
    final now = sekarang ?? DateTime.now();
    final cermin = await Cermin.baca();
    if (cermin == null) return;
    final u = _map(cermin['user']);
    final uid = '${u['id'] ?? ''}';
    final role = '${u['role'] ?? 'member'}';
    final listMk = _normalMatkul(cermin['matkul']);
    if (uid.isEmpty || listMk.isEmpty) return;
    final listTg = _normalTugas(cermin['tugas']);
    await _simpanDariData(listMk, listTg, uid, role, now);
  } catch (_) {}
}

/// Alarm tepi / tick menit: entry-point background, panggil versi ringan.
@pragma('vm:entry-point')
Future<void> alarmRingan() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();
  } catch (_) {}
  try {
    await segarkanWidgetRingan();
  } catch (_) {}
}

/// Jadwalkan one-shot tepat di momen penting sesi + tick tiap menit.
/// Bikin status flip (mulai/selesai) tanpa perlu buka app samsek.
Future<void> jadwalkanTepiDanTick(List<SesiKelas> sesi, DateTime now) async {
  try {
    for (var i = 0; i < 12; i++) {
      try {
        await AndroidAlarmManager.cancel(_tepiBase + i);
      } catch (_) {}
    }
    for (var i = 0; i < _tickJumlah; i++) {
      try {
        await AndroidAlarmManager.cancel(_tickBase + i);
      } catch (_) {}
    }
    var idTepi = _tepiBase;
    for (final s in sesi.take(4)) {
      final momen = [s.mulai.subtract(const Duration(minutes: 30)), s.mulai, s.selesai];
      for (final t in momen) {
        if (t.isAfter(now.add(const Duration(seconds: 30))) && idTepi < _tepiBase + 12) {
          try {
            await AndroidAlarmManager.oneShotAt(
              t,
              idTepi++,
              alarmRingan,
              allowWhileIdle: true,
              exact: true,
              wakeup: true,
              rescheduleOnReboot: true,
            );
          } catch (_) {}
        }
      }
    }
    for (var i = 1; i <= _tickJumlah; i++) {
      final t = now.add(Duration(minutes: i));
      try {
        await AndroidAlarmManager.oneShotAt(
          t,
          _tickBase + i - 1,
          alarmRingan,
          allowWhileIdle: true,
          exact: false,
          wakeup: true,
          rescheduleOnReboot: false,
        );
      } catch (_) {}
    }
  } catch (_) {}
}

/// Dipanggil alarm periodik + tiap snapshot web masuk + tiap buka app.
/// Prioritas: snapshot Cermin dari WebView. Fallback: Supabase langsung.
Future<void> cekHarian({DateTime? sekarang}) async {
  final prefs = await SharedPreferences.getInstance();
  final now = sekarang ?? DateTime.now();
  final kunciHari = '${now.year}-${now.month}-${now.day}';
  try {
    List<Map<String, dynamic>> listMk = [];
    List<Map<String, dynamic>> listTg = [];
    String uid = '';
    String role = 'member';
    try {
      final cermin = await Cermin.baca();
      if (cermin != null) {
        final u = _map(cermin['user']);
        uid = '${u['id'] ?? ''}';
        role = '${u['role'] ?? 'member'}';
        listMk = _normalMatkul(cermin['matkul']);
        listTg = _normalTugas(cermin['tugas']);
      }
    } catch (_) {}
    if (uid.isEmpty || listMk.isEmpty) {
      if (!supaReady) {
        try {
          await initSupa();
        } catch (_) {}
      }
      try {
        final sesi = Supabase.instance.client.auth.currentUser;
        if (sesi == null) {
          await segarkanWidgetRingan(sekarang: now);
          return;
        }
        uid = sesi.id;
        final mk = await sb.from('matkul').select('id,nama,jadwal,anggota_ids,pj_ids,dosen');
        final tg = await sb
            .from('tugas')
            .select('judul,matkul_id,deadline_at,status,selesai_oleh')
            .eq('status', 'resmi')
            .eq('arsip', false);
        listMk = (mk as List).map((e) => _map(e)).toList();
        listTg = (tg as List).map((e) => _map(e)).toList();
        try {
          final peran =
              await sb.from('profiles').select('id,role').eq('id', uid).maybeSingle();
          role = '${peran?['role'] ?? 'member'}';
        } catch (_) {}
      } catch (_) {
        await segarkanWidgetRingan(sekarang: now);
        return;
      }
    }
    final boleh = listMk.where((m) => _terlihat(m, uid, role)).toList();
    final nama = {for (final m in boleh) '${m['id']}': '${m['nama']}'};
    final ingat = ingatDeadline(listTg, nama, uid)
        .where((t) => t.matkul.isNotEmpty && nama.values.contains(t.matkul))
        .toList();
    final sesiHari = sesiHariIniDetail(boleh, sekarang: now);
    final fokus = fokusHariIni(sesiHari, sekarang: now);
    await simpanWidget(fokus);
    await jadwalkanTepiDanTick(sesiHari, now);

    for (final s in sesiHari) {
      final beda = s.mulai.difference(now).inMinutes;
      if (beda >= 0 && beda <= 30) {
        final kunci = 'ingat-$kunciHari-${s.matkul}-${s.jam}';
        if (prefs.getBool(kunci) == true) continue;
        await prefs.setBool(kunci, true);
        final d = s.dosen.isEmpty ? '' : '${s.dosen.join(' · ')} · ';
        await bunyi('30 menit lagi: ${s.matkul}', '$d${s.jam} @ ${s.ruang}');
      }
    }

    if (prefs.getString('campur') == kunciHari) return;
    if (ingat.isEmpty && sesiHari.isEmpty) return;
    final baris = <String>[];
    if (ingat.isNotEmpty) {
      baris.add(
        '${ingat.length} tugas: ${ingat.take(2).map((t) => '${t.judul} (H-${t.sisa}${t.matkul.isEmpty ? '' : ', ${t.matkul}'})').join('; ')}',
      );
    }
    if (sesiHari.isNotEmpty) {
      baris.add(
        'Jadwal ${namaHariIni()}: ${sesiHari.map((s) => '${s.matkul} ${s.jam} @ ${s.ruang}').join(' · ')}',
      );
    }
    await prefs.setString('campur', kunciHari);
    await bunyi(
      ingat.isNotEmpty
          ? 'BeDeBest · ${ingat.length} deadline mendekat'
          : 'BeDeBest · jadwal hari ini',
      baris.join('\n'),
    );
  } catch (_) {}
}
