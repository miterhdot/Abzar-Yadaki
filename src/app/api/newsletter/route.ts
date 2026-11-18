/* دستور ۴۲/فاز M2 — عضویت خبرنامه: محدودیت نرخ (الگوی A2) + اعتبارسنجی + درج در جدول newsletter
   نکتهٔ معماری (اصلاح دیپلوی): src/lib/supabase.ts ماژول کلاینت است ("use client") — route سروری
   نمی‌تواند توابع آن را صدا بزند؛ این route کلاینت خودش را مستقیم با کلید عمومی anon می‌سازد
   (درج از مسیر سیاست RLS «newsletter_insert_public» — همان کلید عمومی مرورگر). */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normFa } from "@/lib/format";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

const db = (): SupabaseClient | null => {
  if (!URL_ || !ANON) return null;
  if (!client) client = createClient(URL_, ANON, { auth: { persistSession: false } });
  return client;
};

const EMAIL = /^\S+@\S+\.\S+$/;

export async function POST(req: Request) {
  const rl = rateLimit(`nl:${clientIp(req)}`, 4, 600_000); /* حداکثر ۴ درخواست در ۱۰ دقیقه */
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { contact?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }

  /* نرمال‌سازی فارسی (ارقام/ی/ک) + حذف فاصله و خط تیره — «۰۹۱۲ ۳۴۵ ۶۷۸۹» هم قبول است */
  const contact = normFa(String(body.contact ?? ""))
    .replace(/[\s-]+/g, "")
    .toLowerCase();
  const isEmail = EMAIL.test(contact);
  const isPhone = /^09\d{9}$/.test(contact);
  if (!isEmail && !isPhone) {
    return NextResponse.json(
      { ok: false, error: "شمارهٔ موبایل (۰۹...) یا ایمیل معتبر وارد کنید." },
      { status: 400 }
    );
  }

  const c = db();
  if (!c) return NextResponse.json({ ok: false, error: "db-off" }, { status: 503 });

  const { error } = await c.from("newsletter").insert({ contact });
  if (error) {
    /* عضویت تکراری = پیام موفق با نکته */
    if (/duplicate/i.test(error.message)) return NextResponse.json({ ok: true, dup: true });
    return NextResponse.json({ ok: false, error: "ثبت عضویت انجام نشد — بعداً تلاش کنید." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
