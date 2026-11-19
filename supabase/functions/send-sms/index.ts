// ═══ ابزار یدکی — لایهٔ پیامک sms.ir (دستور ۴۳) ═══
// تنها نقطهٔ نگه‌داری کلید سرویس پیامک — به‌صورت Secret تابع (هرگز در کد/مخزن نیست).
// نقش‌ها:
//   ① هوک رسمی send_sms ساپابیس (GoTrue) → ارسال کد یکبارمصرف ورود با قالب Verify sms.ir
//   ② اقدامات ادمین (فقط نقش admin): وضعیت، اعتبار، ارسال آزمایشی، اعلان سفارش
// مستندات REST: https://sms.ir/web-service/ و https://sms.ir/rest-api/
//   POST /v1/send/verify  {mobile, templateId, parameters[]} — خطوط اولویت‌دار، مناسب کد تأیید
//   POST /v1/send/bulk    {lineNumber, messageText, mobiles[]} — از خط اختصاصی خودمان
//   GET  /v1/credit       → اعتبار (decimal)
// پاکت پاسخ یکسان: {status: 1|0|10..123, message, data} — کد ۱ = موفق.

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hook-secret-*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API = "https://api.sms.ir/v1";

// ── پیکربندی (Secrets تابع — با اسکریپت scripts/sms_set_key.py تنظیم می‌شود) ──
const KEY = Deno.env.get("SMS_IR_API_KEY") ?? "";
const OTP_TPL = Number(Deno.env.get("SMS_OTP_TEMPLATE_ID") ?? "") || 0;
const OTP_PARAM = Deno.env.get("SMS_OTP_PARAM_NAME") ?? "CODE";
const LINE = Deno.env.get("SMS_LINE_NUMBER") ?? "";
const STATUS_TPL = Number(Deno.env.get("SMS_STATUS_TEMPLATE_ID") ?? "") || 0;
const HOOK_SECRET = Deno.env.get("SMS_HOOK_SECRET") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const STATUS_FA: Record<number, string> = {
  0: "خطای سیستم sms.ir",
  10: "کلید API نامعتبر",
  11: "کلید API غیرفعال",
  12: "کلید API محدود به IP",
  13: "حساب sms.ir غیرفعال",
  14: "حساب sms.ir معلق",
  20: "محدودیت تعداد درخواست",
  101: "شمارهٔ خط نامعتبر",
  102: "اعتبار کافی نیست",
  103: "متن پیامک خالی",
  104: "شمارهٔ موبایل نامعتبر",
  105: "بیش از ۱۰۰ شماره",
  106: "بیش از ۱۰۰ متن",
  107: "فهرست شماره‌ها خالی",
  108: "فهرست متن‌ها خالی",
  109: "زمان ارسال نامعتبر",
  110: "تعداد شماره و متن برابر نیست",
  111: "packId نامعلوم",
  112: "چیزی برای حذف نیست",
  113: "قالب یافت نشد (در پنل sms.ir ثبت نشده)",
  114: "مقدار پارامتر بیش از ۲۵ نویسه",
  115: "شماره در لیست سیاه",
  116: "نام پارامتر خالی",
  117: "متن قالب تأیید نشده",
  118: "پیامک بیش از حد",
  119: "ارتقای پلن لازم است",
  123: "خط نیازمند فعال‌سازی",
};

/** نرمال‌سازی موبایل ایران — ارقام فارسی/عربی، +۹۸، ۰۰۹۸، ۹۸، ۰۹ … → خروجی e10 = 9xxxxxxxxx */
function normMobile(p: string): { e10: string } | null {
  let d = p
    .replace(/[۰-۹]/g, (ch) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)))
    .replace(/[٠-٩]/g, (ch) => String("٠١٢٣٤٥٦٧٨٩".indexOf(ch)))
    .replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return /^9\d{9}$/.test(d) ? { e10: d } : null;
}

/** فراخوانی REST sms.ir — پاکت {status, message, data} را برمی‌گرداند */
async function smsIr(method: string, path: string, body?: unknown): Promise<{
  ok: boolean; status: number; message: string; data: unknown;
}> {
  if (!KEY) return { ok: false, status: -1, message: "کلید API تنظیم نشده است", data: null };
  try {
    const res = await fetch(API + path, {
      method,
      headers: { "x-api-key": KEY, "Content-Type": "application/json", "Accept": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const j = await res.json().catch(() => null) as { status?: number; message?: string; data?: unknown } | null;
    const st = typeof j?.status === "number" ? j.status : res.ok ? 1 : 0;
    return { ok: res.ok && st === 1, status: st, message: j?.message ?? "", data: j?.data ?? null };
  } catch (e) {
    return { ok: false, status: -2, message: "اتصال به sms.ir برقرار نشد: " + String(e), data: null };
  }
}

/** ارسال با قالب Verify (کد تأیید/اطلاع‌رسانی) */
function sendVerify(mobile: string, templateId: number, params: { name: string; value: string }[]) {
  return smsIr("POST", "/send/verify", { mobile, templateId, parameters: params });
}

/** ارسال از خط اختصاصی خودمان (Bulk تک‌شماره‌ای) */
function sendBulk(text: string, mobile: string) {
  return smsIr("POST", "/send/bulk", { lineNumber: Number(LINE), messageText: text, mobiles: [mobile] });
}

/** فقط نقش admin — اعتبارسنجی توکن توسط خود GoTrue + نقش از profiles (با service_role) */
async function adminSub(authz: string): Promise<string | null> {
  const m = /^Bearer\s+(.+)$/i.exec(authz ?? "");
  if (!m || !SB_URL || !SB_KEY) return null;
  try {
    const u = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${m[1]}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!u.ok) return null;
    const user = (await u.json()) as { id?: string };
    if (!user.id) return null;
    const res = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    const rows = (await res.json()) as { role?: string }[];
    return rows[0]?.role === "admin" ? user.id : null;
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** پاسخ هوک GoTrue — بدنهٔ ۲۰۰ با پاکت {error: null | {http_code, message}} */
function hookResp(err: { http_code: number; message: string } | null): Response {
  return new Response(JSON.stringify({ error: err }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const ORDER_STATUS_FA: Record<string, string> = {
  processing: "در حال پردازش",
  sent: "ارسال شد",
  done: "تحویل شد",
  canceled: "لغو شد",
};

/**
 * راستی‌آزمایی امضای Standard Webhooks (قرارداد رسمی هوک‌های GoTrue):
 * هدرهای webhook-id / webhook-timestamp / webhook-signature — HMAC-SHA256 روی "id.ts.body"
 * با کلید = رمزگشاییِ base64ِ بخشِ whsec_ (فرمت پیکربندی: "v1,whsec_<base64>").
 */
async function verifyHookSig(headers: Headers, rawBody: string): Promise<boolean> {
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigs = headers.get("webhook-signature");
  if (!id || !ts || !sigs || !HOOK_SECRET) return false;
  // شناسه‌ها به‌صورت لیست ویرگولی "v1,whsec_..." — آخرین نسخه استفاده می‌شود
  const entry = HOOK_SECRET.split(",").filter((s) => s.startsWith("whsec_")).pop();
  if (!entry) return false;
  const b64 = entry.slice("whsec_".length);
  const key = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  // تمردهوای زمانی — بیش از ۵ دقیقه اختلاف رد می‌شود
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(ts)) > 300) return false;
  const signed = new TextEncoder().encode(`${id}.${ts}.${rawBody}`);
  const keyI = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const v of sigs.split(" ")) {
    const [ver, sigB64] = v.split(",");
    if (ver !== "v1") continue;
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    if (await crypto.subtle.verify("HMAC", keyI, sig, signed)) return true;
  }
  return false;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "فقط POST" }, 405);

  // ── ① هوک send_sms — امضای Standard Webhooks از سمت GoTrue ──
  const authz = req.headers.get("Authorization") ?? "";
  const rawBody = await req.text();

  if (req.headers.has("webhook-signature")) {
    if (!(await verifyHookSig(req.headers, rawBody))) {
      return hookResp({ http_code: 401, message: "هوک پیامک: امضای Standard Webhooks نامعتبر" });
    }
    // بدنهٔ هوک GoTrue: {metadata, user, sms: {otp, phone, type}} — با پشتیبانی از فرمت تخت قدیمی
    const b = JSON.parse(rawBody || "{}") as {
      phone?: string; otp?: string; type?: string;
      sms?: { phone?: string; otp?: string; type?: string };
    };
    const sms = b.sms ?? b;
    const m = normMobile(sms.phone ?? "");
    if (!m || !sms.otp) return hookResp({ http_code: 400, message: "پارامترهای هوک پیامک نامعتبر" });
    if (!KEY) return hookResp({ http_code: 503, message: "کلید API سرویس پیامک تنظیم نشده است" });
    if (!OTP_TPL) return hookResp({ http_code: 503, message: "قالب کد تأیید تنظیم نشده است" });
    const r = await sendVerify(m.e10, OTP_TPL, [{ name: OTP_PARAM, value: String(b.otp).slice(0, 25) }]);
    if (!r.ok) {
      const fa = STATUS_FA[r.status] ?? r.message ?? "خطای نامعلوم";
      return hookResp({ http_code: 502, message: `ارسال کد ناموفق (${r.status}): ${fa}` });
    }
    return hookResp(null);
  }

  // ── ② اقدامات ادمین — فقط JWT ادمین (امضای پلتفرم + نقش admin در profiles) ──
  const sub = await adminSub(authz);
  if (!sub) return json({ error: "فقط ادمین واردشده مجاز است" }, 401);

  const b = JSON.parse(rawBody || "{}") as {
    action?: string; mobile?: string; text?: string; kind?: string; code?: string;
  };

  if (b.action === "status") {
    return json({
      configured: Boolean(KEY), otpTemplate: Boolean(OTP_TPL), line: Boolean(LINE),
      statusTemplate: Boolean(STATUS_TPL), hookReady: Boolean(HOOK_SECRET),
    });
  }

  if (b.action === "credit") {
    const r = await smsIr("GET", "/credit");
    return r.ok
      ? json({ ok: true, credit: r.data })
      : json({ ok: false, error: `(${r.status}) ${STATUS_FA[r.status] ?? r.message}` });
  }

  if (b.action === "test") {
    const m = normMobile(b.mobile ?? "");
    const text = (b.text ?? "").trim();
    if (!m) return json({ ok: false, error: "شمارهٔ موبایل نامعتبر" });
    if (!text) return json({ ok: false, error: "متن خالی" });
    if (!LINE) return json({ ok: false, error: "خط ارسال تنظیم نشده است (SMS_LINE_NUMBER)" });
    const r = await sendBulk(text, m.e10);
    const pack = r.data as { packId?: string } | null;
    return r.ok
      ? json({ ok: true, packId: pack?.packId ?? null })
      : json({ ok: false, error: `(${r.status}) ${STATUS_FA[r.status] ?? r.message}` });
  }

  if (b.action === "notify") {
    if (!SB_URL || !SB_KEY) return json({ ok: false, error: "service_role در دسترس نیست" });
    if (b.kind !== "new-order" && b.kind !== "status") return json({ ok: false, error: "نوع اعلان نامعتبر" });
    // toggle اول — صرفه‌جویی در استعلام سفارش
    try {
      const setRes = await fetch(`${SB_URL}/rest/v1/settings?id=eq.true&select=sms_admin_mobile,sms_notify_new_order,sms_notify_status`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        signal: AbortSignal.timeout(10_000),
      });
      const st = (await setRes.json() as { sms_admin_mobile: string; sms_notify_new_order: boolean; sms_notify_status: boolean }[])[0];
      if (!st) return json({ ok: false, error: "تنظیمات یافت نشد" });
      if (b.kind === "new-order" && !st.sms_notify_new_order) return json({ ok: false, error: "اطلاع‌رسانی سفارش جدید خاموش است" });
      if (b.kind === "status" && !st.sms_notify_status) return json({ ok: false, error: "اطلاع‌رسانی تغییر وضعیت خاموش است" });

      const sel = "code, name, phone, items_count, total, status";
      const ordRes = await fetch(`${SB_URL}/rest/v1/orders?code=eq.${encodeURIComponent(b.code ?? "")}&select=${sel}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        signal: AbortSignal.timeout(10_000),
      });
      const order = (await ordRes.json() as { code: string; name: string; phone: string; items_count: number; total: number; status: string }[])[0];
      if (!order) return json({ ok: false, error: "سفارش یافت نشد" });

      let to: string | null = null;
      let text = "";
      if (b.kind === "new-order") {
        to = normMobile(st.sms_admin_mobile ?? "")?.e10 ?? null;
        text = `سفارش جدید ${order.code} — ${order.total} تومان — ${order.name} — ${order.phone}`;
        if (!to) return json({ ok: false, error: "موبایل مدیر در تنظیمات ثبت نشده" });
      } else {
        to = normMobile(order.phone)?.e10 ?? null;
        text = `ابزار یدکی — سفارش ${order.code}: ${ORDER_STATUS_FA[order.status] ?? order.status} — abzaryadaki.com`;
        if (!to) return json({ ok: false, error: "موبایل مشتری نامعتبر است" });
      }

      // قالب وضعیت اگر ثبت شده از Verify؛ وگرنه از خط اختصاصی؛ وگرنه پیام اولیه
      if (STATUS_TPL && b.kind === "status") {
        const r = await sendVerify(to, STATUS_TPL, [
          { name: "ORDER_CODE", value: order.code.slice(0, 25) },
          { name: "STATUS", value: (ORDER_STATUS_FA[order.status] ?? order.status).slice(0, 25) },
        ]);
        return r.ok
          ? json({ ok: true, via: "template" })
          : json({ ok: false, error: `(${r.status}) ${STATUS_FA[r.status] ?? r.message}` });
      }
      if (!LINE) return json({ ok: false, error: "خط ارسال تنظیم نشده است (SMS_LINE_NUMBER)" });
      const r = await sendBulk(text.slice(0, 400), to);
      return r.ok
        ? json({ ok: true, via: "line" })
        : json({ ok: false, error: `(${r.status}) ${STATUS_FA[r.status] ?? r.message}` });
    } catch (e) {
      return json({ ok: false, error: "خطای داخلی: " + String(e) });
    }
  }

  return json({ error: "اقدام نامعتبر" }, 400);
});
