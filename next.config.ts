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
};

export default nextConfig;
