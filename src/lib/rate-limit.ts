/* محدودساز نرخ درون‌حافظه‌ای — دستور ۳۲ (A2)
   الگو: rate-limit ریپوهای مرجع (vercel/commerce).
   محدودیت شناخته‌شده: در ورسل هر نمونهٔ serverless شمارندهٔ مستقل دارد (best-effort).
   بدون وابستگی خارجی؛ پاک‌سازی خودکار کلیدهای منقضی برای جلوگیری از رشد حافظه. */
import { NextResponse } from "next/server";

type Bucket = { n: number; reset: number };

const buckets = new Map<string, Bucket>();

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } => {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    buckets.set(key, { n: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.n += 1;
  if (b.n > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
};

export const clientIp = (req: Request): string =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "anon";

export const tooMany = (retryAfter: number): NextResponse =>
  NextResponse.json(
    {
      error: "rate_limited",
      message: "درخواست‌های شما بیش از حد مجاز است — لطفاً کمی بعد دوباره تلاش کنید.",
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
