/* دستیار خرید هوشمند اپلیکیشن موبایل — دستور ۱۵
   سمت سرور فقط: z-ai-web-dev-sdk هرگز در کلاینت استفاده نمی‌شود.
   کاتالوگ از کلاینت (استور قابل ویرایش ادمین) می‌آید و اینجا پاک‌سازی می‌شود.
   پرامپت سیستم عیناً از فایل طراحی مدیر (SYS) پرت شده است. */

import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

type CatItem = { id: number; n: string; c: string; p: number };

const sanitizeCatalog = (raw: unknown): CatItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 100)
    .map((x) => {
      const o = x as Record<string, unknown>;
      const id = Number(o?.id);
      const n = String(o?.n ?? "").slice(0, 120);
      const c = String(o?.c ?? "").slice(0, 60);
      const p = Number(o?.p);
      if (!Number.isFinite(id) || !n || !Number.isFinite(p)) return null;
      return { id, n, c, p } satisfies CatItem;
    })
    .filter((x): x is CatItem => x !== null);
};

const sanitizeMessages = (raw: unknown): { role: "user" | "assistant"; content: string }[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-12)
    .map((m) => {
      const o = m as Record<string, unknown>;
      const role = o?.role === "assistant" ? "assistant" : "user";
      const content = String(o?.content ?? "").slice(0, 2000).trim();
      if (!content) return null;
      return { role, content } as { role: "user" | "assistant"; content: string };
    })
    .filter((m): m is { role: "user" | "assistant"; content: string } => m !== null);
};

const sysOf = (car: string, catalog: CatItem[]): string =>
  `تو دستیار خرید فروشگاه «ابزار یدکی» هستی. فقط فارسی و کوتاه (حداکثر سه جمله) جواب بده. فقط از کاتالوگ زیر پیشنهاد بده و شناسه‌ی هر پیشنهاد را به شکل [[شماره]] در انتهای پیام بنویس (حداکثر ۳ مورد). درباره‌ی سازگاری قطعه با خودرو قطعی حرف نزن؛ بگو قبل از خرید کد فنی را تطبیق دهد. اگر کالای مناسب نیست صادقانه بگو. خودروی مشتری: ${car || "نامشخص"}.\nکاتالوگ (شناسه|نام|دسته|قیمت به تومان):\n${catalog
    .map((x) => [x.id, x.n, x.c, x.p].join("|"))
    .join("\n")}`;

export async function POST(req: Request) {
  try {
    /* دستور ۳۲ (A2): سقف ۱۰ درخواست LLM در دقیقه برای هر IP — مسیر پرهزینه */
    const rl = rateLimit(`ai:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const car = typeof body?.car === "string" ? body.car.slice(0, 40) : "";
    const catalog = sanitizeCatalog(body?.catalog);
    const messages = sanitizeMessages(body?.messages);
    if (!messages.length) {
      return NextResponse.json({ error: "empty" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "assistant", content: sysOf(car, catalog) }, ...messages],
      thinking: { type: "disabled" },
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[ai-chat] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ai-unavailable" }, { status: 503 });
  }
}
