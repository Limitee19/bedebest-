import type { NextConfig } from "next";

/**
 * Header keamanan dasar untuk semua respons.
 * Tanpa CSP ketat karena aplikasi memakai inline script tema;
 * proteksi XSS utama tetap: React auto-escaping + validasi input API.
 * Catatan: pertimbangkan CSP nonce untuk script tema bila ingin lebih ketat.
 */
const HEADERS = [
  { key: "X-Frame-Options", value: "DENY" }, // anti clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: HEADERS }];
  },
};

export default nextConfig;
