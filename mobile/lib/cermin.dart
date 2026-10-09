import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Snapshot terakhir dari Web (via BridgeSync) — dipakai widget + alarm
/// agar "sama persis" tanpa login ganda.
class Cermin {
  static const kunci = 'bedebest-cermin';

  static Future<void> simpan(String json) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(kunci, json);
  }

  static Future<Map<String, dynamic>?> baca() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(kunci);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}
