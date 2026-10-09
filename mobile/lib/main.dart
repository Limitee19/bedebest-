import 'dart:io';

import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'jadwal.dart';
import 'notif.dart';
import 'supa.dart';

@pragma('vm:entry-point')
Future<void> alarmHarian() async {
  await initSupa();
  await cekHarian();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  String? gagal;
  try {
    await initSupa();
  } catch (e) {
    gagal = '$e';
  }
  try {
    await siapNotif();
  } catch (_) {}
  // Alarm hanya Android; desktop (Windows run) lewati agar tidak crash/blackscreen.
  if (Platform.isAndroid) {
    try {
      await AndroidAlarmManager.initialize();
      await AndroidAlarmManager.periodic(
        const Duration(minutes: 30),
        7,
        alarmHarian,
        wakeup: true,
        rescheduleOnReboot: true,
      );
    } catch (_) {}
  }
  // Flutter error → tampil merah di layar, jangan blackscreen misterius.
  ErrorWidget.builder = (d) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('BeDeBest',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                const Text('Ada galat tampilan. Screenshot + kirim ke admin ya.'),
                const SizedBox(height: 8),
                Text('$d',
                    style: const TextStyle(fontSize: 11, color: Colors.black54)),
              ],
            ),
          ),
        ),
      );
  runApp(BeDeBestApp(gagalBoot: gagal));
}

class BeDeBestApp extends StatelessWidget {
  final String? gagalBoot;
  const BeDeBestApp({super.key, this.gagalBoot});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BeDeBest',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFE8552F)),
      ),
      home: gagalBoot == null
          ? const Gerbang()
          : BootGagal(pesan: gagalBoot!),
    );
  }
}

class BootGagal extends StatelessWidget {
  final String pesan;
  const BootGagal({super.key, required this.pesan});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('BeDeBest',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('Gagal tersambung ke cloud. Cek internet lalu buka ulang.'),
              const SizedBox(height: 8),
              Text(pesan, style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
        ),
      ),
    );
  }
}

class Gerbang extends StatefulWidget {
  const Gerbang({super.key});
  @override
  State<Gerbang> createState() => _GerbangState();
}

class _GerbangState extends State<Gerbang> {
  bool siap = false;
  Session? sesi;

  @override
  void initState() {
    super.initState();
    sesi = sb.auth.currentSession;
    sb.auth.onAuthStateChange.listen((d) {
      if (mounted) setState(() => sesi = d.session);
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) setState(() => siap = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!siap) {
      return const Scaffold(body: Center(child: Text('Menyiapkan papan tulis…')));
    }
    return sesi == null ? const MasukPage() : const DasborPage();
  }
}

class MasukPage extends StatefulWidget {
  const MasukPage({super.key});
  @override
  State<MasukPage> createState() => _MasukPageState();
}

class _MasukPageState extends State<MasukPage> {
  final nama = TextEditingController();
  final sandi = TextEditingController();
  String? galat;
  bool sibuk = false;
  List<Map<String, String>> daftar = [];

  @override
  void initState() {
    super.initState();
    muat();
  }

  Future<void> muat() async {
    try {
      final r = await sb.from('profiles').select('nama,nim').order('nama').limit(100);
      setState(() {
        daftar = (r as List)
            .map((e) => {'nama': '${e['nama']}', 'nim': '${e['nim']}'})
            .toList();
      });
    } catch (_) {}
  }

  String emailDari(String nim) => nim == '260242649788'
      ? 'muhammadarielfathoni12@gmail.com'
      : '$nim@siswa.bedebest.id';

  Future<void> kirim() async {
    setState(() {
      sibuk = true;
      galat = null;
    });
    try {
      final cocok = daftar.firstWhere(
        (e) => e['nama']!.toLowerCase() == nama.text.trim().toLowerCase(),
        orElse: () => {'nama': '', 'nim': ''},
      );
      final nim = cocok['nim']!.isNotEmpty ? cocok['nim']! : sandi.text.trim();
      await sb.auth.signInWithPassword(
        email: emailDari(nim),
        password: sandi.text.trim(),
      );
      await cekHarian();
    } on AuthException catch (e) {
      setState(() => galat = e.message);
    } catch (_) {
      setState(() => galat = 'Nama atau kata sandi salah.');
    } finally {
      if (mounted) setState(() => sibuk = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 24),
            const Text('BeDeBest',
                style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900)),
            const Text('Satu papan, semua tugas sekelas!',
                style: TextStyle(fontSize: 15, color: Colors.black54)),
            const SizedBox(height: 20),
            Autocomplete<String>(
              optionsBuilder: (v) => v.text.isEmpty
                  ? const Iterable<String>.empty()
                  : daftar
                      .map((e) => e['nama']!)
                      .where((n) => n.toLowerCase().contains(v.text.toLowerCase())),
              onSelected: (v) => nama.text = v,
              fieldViewBuilder: (c, t, f, s) => TextField(
                controller: t,
                focusNode: f,
                decoration: const InputDecoration(
                  labelText: 'Nama lengkap',
                  border: OutlineInputBorder(),
                ),
                onChanged: (_) => nama.text = t.text,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: sandi,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'NIM (kata sandi)',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (_) => kirim(),
            ),
            if (galat != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(galat!, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: sibuk ? null : kirim,
              child: Text(sibuk ? 'Masuk…' : 'Masuk ke papan'),
            ),
          ],
        ),
      ),
    );
  }
}

class DasborPage extends StatefulWidget {
  const DasborPage({super.key});
  @override
  State<DasborPage> createState() => _DasborPageState();
}

class _DasborPageState extends State<DasborPage> {
  List<Sesi> sesi = [];
  List<TugasIngat> ingat = [];
  bool muat = true;

  @override
  void initState() {
    super.initState();
    segarkan();
  }

  Future<void> segarkan() async {
    setState(() => muat = true);
    try {
      final uid = sb.auth.currentUser!.id;
      final mk = await sb.from('matkul').select('id,nama,jadwal,anggota_ids,pj_ids');
      final tg = await sb
          .from('tugas')
          .select('judul,matkul_id,deadline_at,status,selesai_oleh')
          .eq('status', 'resmi')
          .eq('arsip', false);
      final peran =
          await sb.from('profiles').select('role').eq('id', uid).maybeSingle();
      final role = (peran?['role'] ?? '').toString();
      final listMk = (mk as List).cast<Map<String, dynamic>>();
      bool terlihat(Map<String, dynamic> m) {
        if (role == 'admin') return true;
        final pj = (m['pj_ids'] as List? ?? []).map((e) => '$e');
        if (pj.contains(uid)) return true;
        final ag = (m['anggota_ids'] as List? ?? []).map((e) => '$e');
        return ag.isEmpty || ag.contains(uid);
      }
      final boleh = listMk.where(terlihat).toList();
      final nama = {for (final m in boleh) '${m['id']}': '${m['nama']}'};
      if (mounted) {
        setState(() {
          sesi = sesiHariIni(boleh);
          ingat = ingatDeadline(
            (tg as List).cast<Map<String, dynamic>>(),
            nama,
            uid,
          ).where((t) => nama.values.contains(t.matkul)).toList();
        });
      }
      await cekHarian();
    } catch (_) {
    } finally {
      if (mounted) setState(() => muat = false);
    }
  }

  String labelSisa(int s) =>
      s == 0 ? 'hari ini!' : s == 1 ? 'besok' : '$s hari lagi';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BeDeBest',
            style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          IconButton(
            tooltip: 'Segarkan',
            onPressed: segarkan,
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Keluar',
            onPressed: () => sb.auth.signOut(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: segarkan,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Jadwal ${namaHariIni()}',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 8),
                    if (sesi.isEmpty)
                      const Text('Hari ini tidak ada kelas. Rebahan yang rajin ya.'),
                    for (final s in sesi)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.school),
                        title: Text(s.matkul,
                            style:
                                const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text('${s.jam} · ${s.ruang}'),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Deadline H-3 sampai H-0',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 8),
                    if (ingat.isEmpty)
                      const Text('Aman! Tidak ada deadline mepet.'),
                    for (final t in ingat)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.alarm),
                        title: Text(t.judul,
                            style:
                                const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text(
                            '${t.matkul} · ${labelSisa(t.sisa)}'),
                      ),
                  ],
                ),
              ),
            ),
            if (muat)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            const SizedBox(height: 8),
            const Text(
              'Widget: tahan layar utama HP → Widget → BeDeBest → pasang. '
              'Widget + notif 30 mnt sebelum kelas update tiap 30 menit.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}
