/* دستور ۴۲/فاز M2 — عضویت خبرنامه: محدودیت نرخ (الگوی A2) + اعتبارسنجی + درج در جدول newsletter */
import { NextResponse } from "next/server";
import { normFa } from "@/lib/format";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { dbNewsletterAdd } from "@/lib/supabase";

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

  const res = await dbNewsletterAdd(contact);
  if (!res.ok) {
    /* عضویت تکراری = پیام موفق با نکته */
    if (res.error.includes("duplicate")) return NextResponse.json({ ok: true, dup: true });
    return NextResponse.json({ ok: false, error: "ثبت عضویت انجام نشد — بعداً تلاش کنید." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
