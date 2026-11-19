import type { NextConfig } from "next";

/* ── حالت‌های ساخت ─────────────────────────────────────────────
   پیش‌فرض (بدون متغیر محیطی): output standalone برای میزبانی Node — عین وضعیت قبلی
   STATIC_EXPORT=1: خروجی استاتیک برای GitHub Pages (دستور ۱۷)
   NEXT_PUBLIC_BASE_PATH: فقط در حالت استاتیک تنظیم می‌شود (مثلاً /abzaryadaki) */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isStatic ? ("export" as const) : ("standalone" as const),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(isStatic ? { images: { unoptimized: true } } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* حسابرسی امنیتی ۱۴۰۵/۰۸/۲۸ — هدرهای امنیتی روی همهٔ مسیرها
     CSP عملی برای Next App Router + ساپابیس (REST/Realtime)؛
     frame-ancestors 'none' معادل XFO و HSTS از سمت ورسل اضافه می‌شود. */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://wdbixiercvkshmamobro.supabase.co wss://wdbixiercvkshmamobro.supabase.co",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
