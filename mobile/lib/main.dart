import 'dart:io';

import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'cermin.dart';
import 'notif.dart';
import 'supa.dart';

/// URL web produksi. Ganti saat deploy stabil, atau isi dari layar Pengaturan.
const String webAwal = String.fromEnvironment(
  'WEB_URL',
  defaultValue: 'https://bedebest.vercel.app',
);

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
  if (Platform.isAndroid) {
    try {
      await AndroidAlarmManager.initialize();
      // 15 menit agar hitung mundur "X menit lagi" tidak kedaluwarsa.
      await AndroidAlarmManager.periodic(
        const Duration(minutes: 15),
        7,
        alarmHarian,
        wakeup: true,
        rescheduleOnReboot: true,
      );
    } catch (_) {}
  }
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
          ? const CerminWeb()
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

/// WebView = web persis (UI/UX identik, login/sesi ikut web).
/// BridgeSync di web kirim snapshot → Cermin → widget + alarm 30 mnt.
class CerminWeb extends StatefulWidget {
  const CerminWeb({super.key});
  @override
  State<CerminWeb> createState() => _CerminWebState();
}

class _CerminWebState extends State<CerminWeb> {
  late final WebViewController ctl;
  bool muat = true;
  String? galat;
  static final _webHost = Uri.parse(webAwal).host;

  bool _diDalam(Uri u) {
    if (u.scheme != 'http' && u.scheme != 'https') return false;
    return u.host == _webHost;
  }

  Future<void> _bukaLuar(Uri u) async {
    try {
      await launchUrl(u, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  void initState() {
    super.initState();
    ctl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFF6E8))
      ..addJavaScriptChannel(
        'BeDeBestBuka',
        onMessageReceived: (m) async {
          final u = Uri.tryParse(m.message);
          if (u == null) return;
          if (_diDalam(u)) {
            ctl.loadRequest(u);
            return;
          }
          await _bukaLuar(u);
        },
      )
      ..addJavaScriptChannel(
        'BeDeBestSync',
        onMessageReceived: (m) async {
          await Cermin.simpan(m.message);
          await cekHarian();
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (req) {
            final u = Uri.tryParse(req.url);
            if (u == null) return NavigationDecision.prevent;
            if (_diDalam(u)) return NavigationDecision.navigate;
            _bukaLuar(u);
            return NavigationDecision.prevent;
          },
          onPageFinished: (_) {
            if (mounted) setState(() => muat = false);
          },
          onWebResourceError: (e) {
            if (mounted) {
              setState(() => galat = 'Gagal muat web (${e.errorCode}). Cek internet / URL.');
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(webAwal));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: ctl),
            if (muat)
              const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Menyiapkan papan tulis…'),
                  ],
                ),
              ),
            if (galat != null && !muat)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(galat!, textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () {
                          setState(() {
                            galat = null;
                            muat = true;
                          });
                          ctl.loadRequest(Uri.parse(webAwal));
                        },
                        child: const Text('Coba lagi'),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
