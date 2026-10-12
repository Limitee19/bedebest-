import 'package:supabase_flutter/supabase_flutter.dart';

const String supaUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://ghoetgvlhgkiufckdmmx.supabase.co',
);
const String supaAnon = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: 'sb_publishable_jUOvJ_8kVMCUO56Emx8Ecg_5T6yBRXQ',
);

bool supaReady = false;

Future<void> initSupa() async {
  if (supaReady) return;
  try {
    // ignore: deprecated_member_use
    await Supabase.initialize(url: supaUrl, anonKey: supaAnon);
    supaReady = true;
  } catch (_) {
    // Background isolate: jangan lempar — biar fallback Cermin tetap jalan.
    supaReady = false;
    rethrow;
  }
}

SupabaseClient get sb => Supabase.instance.client;
