import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'cermin.dart';
import 'jadwal.dart';
import 'supa.dart';

final notif = FlutterLocalNotificationsPlugin();
bool _notifSiap = false;

Future<void> siapNotif() async {
  if (_notifSiap) return;
  const android = AndroidInitializationSettings('@mipmap/ic_launcher');
  await notif.initialize(const InitializationSettings(android: android));
  await notif
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.requestNotificationsPermission();
  _notifSiap = true;
}

Future<void> bunyi(String judul, String isi) async {
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
      ),
    ),
  );
}

Future<void> simpanWidget(String judul, String baris) async {
  try {
    await HomeWidget.saveWidgetData('judul', judul);
    await HomeWidget.saveWidgetData('baris', baris);
    await HomeWidget.updateWidget(
      androidName: 'BeDeBestWidget',
      qualifiedAndroidName: 'id.bedebest.bedebest.BeDeBestWidget',
    );
  } catch (_) {}
}

/// Dipanggil alarm tiap 30 menit + tiap snapshot web masuk.
/// Prioritas: snapshot Cermin dari WebView (sama persis, tanpa login ganda).
/// Fallback: query Supabase langsung (untuk alarm background tanpa web).
Future<void> cekHarian() async {
  final prefs = await SharedPreferences.getInstance();
  try {
    List<Map<String, dynamic>> listMk = [];
    List<Map<String, dynamic>> listTg = [];
    String uid = '';
    String role = 'member';
    try {
      final cermin = await Cermin.baca();
      if (cermin != null) {
        uid = '${(cermin['user'] as Map?)?['id'] ?? ''}';
        role = '${(cermin['user'] as Map?)?['role'] ?? 'member'}';
        final mk = cermin['matkul'];
        final tg = cermin['tugas'];
        if (mk is List) listMk = mk.cast<Map<String, dynamic>>();
        if (tg is List) listTg = tg.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    if (uid.isEmpty || listMk.isEmpty) {
      if (!supaReady) await initSupa();
      final sesi = Supabase.instance.client.auth.currentUser;
      if (sesi == null) return;
      uid = sesi.id;
      final mk = await sb.from('matkul').select('id,nama,jadwal,anggota_ids,pj_ids');
      final tg = await sb
          .from('tugas')
          .select('judul,matkul_id,deadline_at,status,selesai_oleh')
          .eq('status', 'resmi')
          .eq('arsip', false);
      listMk = (mk as List).cast<Map<String, dynamic>>();
      listTg = (tg as List).cast<Map<String, dynamic>>();
      final peran = await sb.from('profiles').select('id,role').eq('id', uid).maybeSingle();
      role = (peran?['role'] ?? '').toString();
    }
    bool terlihat(Map<String, dynamic> m) {
      if (role == 'admin') return true;
      final pj = (m['pj_ids'] as List? ?? []).map((e) => '$e');
      if (pj.contains(uid)) return true;
      final ag = (m['anggota_ids'] as List? ?? []).map((e) => '$e');
      return ag.isEmpty || ag.contains(uid);
    }

    final boleh = listMk.where(terlihat).toList();
    final nama = {for (final m in boleh) '${m['id']}': '${m['nama']}'};
    final ingat = ingatDeadline(listTg, nama, uid).where((t) => nama.values.contains(t.matkul)).toList();
    final sesi = sesiHariIni(boleh);

    final baris = <String>[];
    if (sesi.isEmpty) {
      baris.add('Hari ini tidak ada kelas. Rebahan yang rajin ya.');
    } else {
      baris.add('Kelas hari ini: ${sesi.map((s) => '${s.matkul} ${s.jam}').join(' · ')}');
    }
    if (ingat.isNotEmpty) {
      baris.add(
        '${ingat.length} deadline: ${ingat.take(2).map((t) => '${t.judul} (H-${t.sisa})').join(', ')}',
      );
    }
    final judul = ingat.isNotEmpty
        ? 'BeDeBest · ${ingat.length} deadline mendekat'
        : sesi.isNotEmpty
            ? 'BeDeBest · ${sesi.length} kelas hari ini'
            : 'BeDeBest · aman';
    await simpanWidget(judul, baris.join('\n'));

    // Pengingat 30 menit sebelum kelas mulai (sekali per sesi per hari)
    final now = DateTime.now();
    final kunciHari = '${now.year}-${now.month}-${now.day}';
    for (final s in sesi) {
      final mulai = jamMulai(s.jam);
      if (mulai == null) continue;
      final beda = mulai.difference(now).inMinutes;
      if (beda >= 0 && beda <= 30) {
        final kunci = 'ingat-$kunciHari-${s.matkul}-${s.jam}';
        if (prefs.getBool(kunci) == true) continue;
        await prefs.setBool(kunci, true);
        await bunyi('30 menit lagi: ${s.matkul}', '${s.jam} @ ${s.ruang}');
      }
    }

    // Pengingat deadline pagi (sekali sehari)
    if (ingat.isNotEmpty && prefs.getString('ingat-deadline') != kunciHari) {
      await prefs.setString('ingat-deadline', kunciHari);
      await bunyi(judul, baris.join('\n'));
    }
  } catch (_) {}
}
