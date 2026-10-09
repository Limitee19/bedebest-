import 'package:supabase_flutter/supabase_flutter.dart';

const String supaUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://ghoetgvlhgkiufckdmmx.supabase.co',
);
const String supaAnon = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue: '',
);

bool supaReady = false;

Future<void> initSupa() async {
  if (supaReady) return;
  // ignore: deprecated_member_use
  await Supabase.initialize(url: supaUrl, anonKey: supaAnon);
  supaReady = true;
}

SupabaseClient get sb => Supabase.instance.client;
