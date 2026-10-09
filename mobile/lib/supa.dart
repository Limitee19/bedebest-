import 'package:supabase_flutter/supabase_flutter.dart';

const String supaUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://ghoetgvlhgkiufckdmmx.supabase.co',
);
const String supaAnon = String.fromEnvironment(
  'SUPABASE_ANON_KEY',
  defaultValue:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdob2V0Z3ZsaGdraXVmY2tkbW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNjUwMTEsImV4cCI6MjEwNjc0MTAxMX0.J5lJUfuC9Z5IXYAoh_ug6aJGhDbqR-FRk4V51Z-u69g',
);

bool supaReady = false;

Future<void> initSupa() async {
  if (supaReady) return;
  // ignore: deprecated_member_use
  await Supabase.initialize(url: supaUrl, anonKey: supaAnon);
  supaReady = true;
}

SupabaseClient get sb => Supabase.instance.client;
