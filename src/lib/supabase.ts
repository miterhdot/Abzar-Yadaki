"use client";

/* ── لایهٔ اتصال به دیتابیس Supabase — فاز D2 (دستور ۲۴) ──
 * فقط با کلید عمومی anon (به مرورگر می‌رود) — امنیت با RLS و توابع امن سمت سرور.
 * هیچ کلید service_role در کد سمت کلاینت/وب وجود ندارد.
 * همهٔ توابع fail-soft هستند: اگر دیتابیس در دسترس نباشد، مقدار null/خطا برمی‌گردد
 * و نماها به رفتار نمایشی مصوب (مصوبه ۱۰) برمی‌گردند.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Banner, Coupon, Msg, Order, OrderStatus, Product, Review, Settings } from "@/data/store";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** کلاینت سراسری مرورگر — فقط وقتی متغیرهای عمومی تنظیم باشند */
export function db(): SupabaseClient | null {
  if (!URL_ || !ANON) return null;
  if (!client) client = createClient(URL_, ANON, { auth: { persistSession: true } });
  return client;
}

/** آیا اتصال دیتابیس برای این استقرار فعال است؟ */
export const dbReady = (): boolean => Boolean(URL_ && ANON);

/* ── انواع بازگشتی ── */

export type CreateOrderInput = {
  name: string;
  phone: string; // رقم لاتین
  items: { id: number; qty: number }[];
  pay: "online" | "cod";
  ship: "post" | "peyk";
  addr: string;
  coupon?: string;
};

export type TrackedOrder = {
  code: string;
  name: string;
  phone: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  pay: "online" | "cod";
  ship: "post" | "peyk";
  addr: string | null;
  created_at: string;
  items: { product_id: number; name: string; emoji: string; qty: number; price_at_order: number }[];
};

/** پیام خطای فارسی از سرور یا پیام پیش‌فرض */
const errMsg = (e: unknown): string => {
  const m = e instanceof Error ? e.message : String(e ?? "");
  return m || "خطای نامشخص در ارتباط با سرور";
};

/* ── ۱) ثبت سفارش — فقط با تابع امن create_order (قیمت‌گذاری سمت سرور) ── */

export async function dbCreateOrder(
  input: CreateOrderInput
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { data, error } = await c.rpc("create_order", {
    p_name: input.name,
    p_phone: input.phone,
    p_items: input.items.map((x) => ({ id: x.id, qty: x.qty })),
    p_pay: input.pay,
    p_ship: input.ship,
    p_addr: input.addr,
    p_coupon: input.coupon?.trim() ? input.coupon.trim() : null,
  });
  if (error) return { ok: false, error: errMsg(error) };
  const code = typeof data === "string" ? data : "";
  if (!code) return { ok: false, error: "کد سفارش دریافت نشد" };
  return { ok: true, code };
}

/* ── ۲) پیگیری سفارش — تابع امن track_order (کد + موبایل) ── */

export async function dbTrackOrder(
  code: string,
  phone: string
): Promise<{ ok: true; order: TrackedOrder } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { data, error } = await c.rpc("track_order", {
    p_code: code.trim(),
    p_phone: phone.trim(),
  });
  if (error) return { ok: false, error: errMsg(error) };
  if (!data) return { ok: false, error: "not-found" };
  return { ok: true, order: data as TrackedOrder };
}

/* ── ۳) پیام تماس با ما — درج مستقیم (سیاست RLS طول فیلدها را اعتبارسنجی می‌کند) ── */

export async function dbSendMessage(m: {
  name: string;
  phone: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("contact_messages").insert({
    name: m.name,
    phone: m.phone,
    subject: m.subject,
    text: m.text,
  });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۴) ورود با کد یکبارمصرف پیامکی (Supabase Auth — هش رمز/نشست امن سمت سرور) ── */

export async function dbOtpSend(
  phone: string
): Promise<{ ok: true } | { ok: false; reason: "db-off" | "sms-off" | "error"; error?: string }> {
  const c = db();
  if (!c) return { ok: false, reason: "db-off" };
  const { error } = await c.auth.signInWithOtp({ phone });
  if (!error) return { ok: true };
  // ارائه‌دهندهٔ پیامک هنوز در پروژهٔ Supabase پیکربندی نشده است
  const msg = error.message.toLowerCase();
  if (msg.includes("phone provider") || msg.includes("sms") || msg.includes("not enabled") || msg.includes("provider is not"))
    return { ok: false, reason: "sms-off" };
  return { ok: false, reason: "error", error: errMsg(error) };
}

export async function dbOtpVerify(
  phone: string,
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/** آیا نشست واقعی Supabase وجود دارد؟ (برای حساب من) */
export async function dbHasSession(): Promise<boolean> {
  const c = db();
  if (!c) return false;
  const { data } = await c.auth.getSession();
  return Boolean(data.session);
}

export type DbProfile = { name: string | null; phone: string | null; role: string };

/** پروفایل کاربر واردشده (RLS: فقط ردیف خودش) */
export async function dbProfile(): Promise<DbProfile | null> {
  const c = db();
  if (!c) return null;
  const { data } = await c.auth.getUser();
  if (!data.user) return null;
  const { data: row } = await c
    .from("profiles")
    .select("name, phone, role")
    .eq("id", data.user.id)
    .maybeSingle();
  return row ? (row as DbProfile) : null;
}

/** ذخیرهٔ نام روی پروفایل (RLS: فقط ستون‌های name/phone ردیف خودش) */
export async function dbSaveName(name: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { data } = await c.auth.getUser();
  if (!data.user) return { ok: false, error: "نشست فعالی وجود ندارد" };
  const { error } = await c.from("profiles").update({ name }).eq("id", data.user.id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/** خروج از نشست دیتابیس */
export async function dbSignOut(): Promise<void> {
  const c = db();
  if (c) await c.auth.signOut();
}

/* ── ۵) سفارش‌های من — از دیتابیس با RLS (فقط سفارش‌های خود کاربر) ── */

const dayDiff = (iso: string): number => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d < 0 ? 0 : d;
};

/** تبدیل به شکل Order محلی — lines از order_items (قیمت لحظهٔ سفارش در DB است) */
export async function dbMyOrders(): Promise<Order[]> {
  const c = db();
  if (!c) return [];
  const { data: sess } = await c.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return [];
  const { data: rows } = await c
    .from("orders")
    .select("id, code, name, phone, items_count, total, status, pay, ship, addr, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];
  const ids = rows.map((r) => (r as { id: number }).id);
  const { data: its } = await c
    .from("order_items")
    .select("order_id, product_id, qty")
    .in("order_id", ids);
  const byOrder = new Map<number, [number, number][]>();
  for (const it of ((its ?? []) as { order_id: number; product_id: number; qty: number }[])) {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push([it.product_id, it.qty]);
    byOrder.set(it.order_id, arr);
  }
  return rows.map((raw) => {
    const r = raw as {
      id: number;
      code: string; name: string; phone: string; items_count: number; total: number;
      status: OrderStatus; pay: "online" | "cod"; ship: "post" | "peyk";
      addr: string | null; created_at: string;
    };
    return {
      code: r.code,
      name: r.name,
      phone: r.phone,
      items: r.items_count,
      total: r.total,
      status: r.status,
      day: dayDiff(r.created_at),
      lines: byOrder.get(r.id) ?? [],
      addr: r.addr ?? undefined,
      pay: r.pay,
      ship: r.ship,
    } satisfies Order;
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   فاز D3 — لایهٔ ادمین (دستور ۲۵ — ۱۴۰۵/۰۸/۱۴)
   ورود ادمین = نشست واقعی Supabase Auth (ایمیل + رمز) + نقش admin در پروفایل؛
   همهٔ دسترسی‌ها با RLS کنترل می‌شود (سیاست‌های is_admin) — پنل فقط UI است.
   وقتی متغیرهای عمومی تنظیم نباشند (db-off)، نما به رفتار نمایشی مصوب برمی‌گردد.
   ═══════════════════════════════════════════════════════════════════════ */

/** پیام فارسی برای خطاهای رایج احرازهویت */
const faAuth = (m: string): string => {
  const s = m.toLowerCase();
  if (s.includes("invalid login credentials")) return "ایمیل یا رمز عبور اشتباه است";
  if (s.includes("email not confirmed")) return "ایمیل حساب تأیید نشده است";
  if (s.includes("too many requests") || s.includes("rate limit")) return "تلاش بیش از حد — چند دقیقه بعد دوباره امتحان کنید";
  if (s.includes("fetch") || s.includes("network")) return "اتصال به سرور برقرار نشد";
  return m || "خطای نامشخص در ورود";
};

/* ── ۶-۱) ورود / بازیابی نشست ادمین ── */

export async function dbAdminLogin(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: faAuth(error.message) };
  const p = await dbProfile();
  if (!p || p.role !== "admin") {
    await c.auth.signOut();
    return { ok: false, error: "این حساب دسترسی مدیریتی ندارد" };
  }
  return { ok: true };
}

/** بازیابی نشست ادمین پس از رفرش صفحه — فقط با نقش admin */
export async function dbAdminRestore(): Promise<boolean> {
  const c = db();
  if (!c) return false;
  const { data } = await c.auth.getSession();
  if (!data.session) return false;
  const p = await dbProfile();
  return Boolean(p && p.role === "admin");
}

/** خروج واقعی ادمین از نشست دیتابیس (همراه logout محلی) */
export async function dbAdminSignOut(): Promise<void> {
  const c = db();
  if (c) await c.auth.signOut();
}

/* ── ۶-۲) سفارش‌ها (همه) — خواندن با سیاست orders_select_admin ── */

export type AdmOrderRow = Order & {
  created: string; // ISO
  subtotal: number;
  shipping: number;
  discount: number;
  coupon: string | null;
  itemsDetail: { pid: number; qty: number; price: number }[]; // قیمت لحظهٔ ثبت (DB)
};

export async function dbAdminOrders(): Promise<{ ok: boolean; rows: AdmOrderRow[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data: rows, error } = await c
    .from("orders")
    .select("id, code, name, phone, items_count, subtotal, shipping, discount, total, status, pay, ship, addr, coupon_code, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  if (!rows?.length) return { ok: true, rows: [] };
  const ids = rows.map((r) => (r as { id: number }).id);
  const { data: its } = await c
    .from("order_items")
    .select("order_id, product_id, qty, price_at_order")
    .in("order_id", ids);
  const byOrder = new Map<number, { pid: number; qty: number; price: number }[]>();
  for (const it of ((its ?? []) as { order_id: number; product_id: number; qty: number; price_at_order: number }[])) {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push({ pid: it.product_id, qty: it.qty, price: it.price_at_order });
    byOrder.set(it.order_id, arr);
  }
  return {
    ok: true,
    rows: rows.map((raw) => {
      const r = raw as {
        id: number; code: string; name: string; phone: string; items_count: number;
        subtotal: number; shipping: number; discount: number; total: number;
        status: OrderStatus; pay: "online" | "cod"; ship: "post" | "peyk";
        addr: string | null; coupon_code: string | null; created_at: string;
      };
      return {
        code: r.code,
        name: r.name,
        phone: r.phone,
        items: r.items_count,
        total: r.total,
        status: r.status,
        day: dayDiff(r.created_at),
        lines: (byOrder.get(r.id) ?? []).map((x) => [x.pid, x.qty] as [number, number]),
        addr: r.addr ?? undefined,
        pay: r.pay,
        ship: r.ship,
        created: r.created_at,
        subtotal: r.subtotal,
        shipping: r.shipping,
        discount: r.discount,
        coupon: r.coupon_code,
        itemsDetail: byOrder.get(r.id) ?? [],
      } satisfies AdmOrderRow;
    }),
  };
}

/** تغییر وضعیت سفارش — فقط ادمین (سیاست orders_admin_update) */
export async function dbSetOrderStatus(code: string, status: OrderStatus): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("orders").update({ status }).eq("code", code);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۳) محصولات — CRUD کامل ادمین (سیاست products_admin_all) ── */

const rowToProduct = (r: {
  id: number; name: string; category: string; emoji: string;
  price: number; old_price: number; brand: string; in_stock: boolean; rating: string | null;
}): Product => ({
  id: r.id, n: r.name, c: r.category, b: r.brand, e: r.emoji,
  p: r.price, o: r.old_price, s: r.in_stock ? 1 : 0, r: r.rating ?? "۴٫۵",
});

export async function dbAdminProducts(): Promise<{ ok: boolean; rows: Product[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c
    .from("products")
    .select("id, name, category, emoji, price, old_price, brand, in_stock, rating")
    .order("id", { ascending: true });
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return { ok: true, rows: ((data ?? []) as Parameters<typeof rowToProduct>[0][]).map(rowToProduct) };
}

export async function dbSaveProduct(
  p: Omit<Product, "id"> & { id?: number }
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const row = {
    name: p.n, category: p.c, emoji: p.e || "🔧", price: p.p,
    old_price: p.o, brand: p.b, in_stock: Boolean(p.s), rating: p.r,
  };
  if (p.id) {
    const { error } = await c.from("products").update(row).eq("id", p.id);
    if (error) return { ok: false, error: errMsg(error) };
    return { ok: true, id: p.id };
  }
  const { data, error } = await c.from("products").insert(row).select("id").single();
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true, id: (data as { id: number }).id };
}

export async function dbDeleteProduct(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۴) نظرات — صف تأیید ادمین (سیاست reviews_admin_all) ── */

export async function dbAdminReviews(): Promise<{ ok: boolean; rows: Review[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c
    .from("reviews")
    .select("id, product_id, name, text, rating, status")
    .order("created_at", { ascending: false });
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return {
    ok: true,
    rows: ((data ?? []) as { id: number; product_id: number; name: string; text: string; rating: string; status: Review["status"] }[]).map(
      (r) => ({ id: r.id, pid: r.product_id, name: r.name, text: r.text, r: r.rating, status: r.status })
    ),
  };
}

export async function dbSetReview(id: number, status: Review["status"]): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("reviews").update({ status }).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbDeleteReview(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۵) کوپن‌ها — CRUD ادمین (سیاست coupons_admin_all) ── */

export type AdmCoupon = Coupon & { used: number };

export async function dbAdminCoupons(): Promise<{ ok: boolean; rows: AdmCoupon[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c
    .from("coupons")
    .select("code, percent, max, active, used_count")
    .order("id", { ascending: true });
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return {
    ok: true,
    rows: ((data ?? []) as { code: string; percent: number; max: number; active: boolean; used_count: number }[]).map((r) => ({
      code: r.code, percent: r.percent, max: r.max, active: r.active, used: r.used_count,
    })),
  };
}

export async function dbAddCoupon(code: string, percent: number, max: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("coupons").insert({ code: code.toUpperCase(), percent, max, active: true });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbToggleCoupon(code: string, active: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("coupons").update({ active }).eq("code", code);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbDeleteCoupon(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("coupons").delete().eq("code", code);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۶) پیام‌های تماس — صندوق ادمین (سیاست messages_admin_all) ── */

export async function dbAdminMessages(): Promise<{ ok: boolean; rows: Msg[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c
    .from("contact_messages")
    .select("id, name, phone, subject, text, unread, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return {
    ok: true,
    rows: ((data ?? []) as { id: number; name: string; phone: string; subject: string; text: string; unread: boolean; created_at: string }[]).map(
      (r) => ({ id: r.id, name: r.name, phone: r.phone, subject: r.subject, text: r.text, unread: r.unread, day: dayDiff(r.created_at) })
    ),
  };
}

export async function dbReadMessage(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("contact_messages").update({ unread: false }).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbDeleteMessage(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("contact_messages").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۷) بنرها — CRUD ادمین (سیاست banners_admin_all — ادمین غیرفعال‌ها را هم می‌بیند) ── */

export async function dbAdminBanners(): Promise<{ ok: boolean; rows: Banner[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c
    .from("banners")
    .select("id, title, description, href, bg, active")
    .order("id", { ascending: true });
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return {
    ok: true,
    rows: ((data ?? []) as { id: number; title: string; description: string; href: string; bg: string; active: boolean }[]).map((r) => ({
      id: r.id, t: r.title, d: r.description, href: r.href, bg: r.bg, active: r.active,
    })),
  };
}

export async function dbAddBanner(t: string, d: string, href: string, bg: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("banners").insert({ title: t, description: d, href, bg, active: true });
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbToggleBanner(id: number, active: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("banners").update({ active }).eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

export async function dbDeleteBanner(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("banners").delete().eq("id", id);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۸) تنظیمات — ذخیرهٔ ادمین (سیاست settings_admin_all) ── */

export async function dbGetSettings(): Promise<Settings | null> {
  const c = db();
  if (!c) return null;
  const { data } = await c
    .from("settings")
    .select("ann, phone, free_shipping, ship_post, ship_peyk")
    .eq("id", true)
    .maybeSingle();
  if (!data) return null;
  const v = data as { ann: string; phone: string; free_shipping: number; ship_post: number; ship_peyk: number };
  return { ann: v.ann, phone: v.phone, free: v.free_shipping, shipPost: v.ship_post, shipPeyk: v.ship_peyk };
}

export async function dbSaveSettings(s: Settings): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = db();
  if (!c) return { ok: false, error: "db-off" };
  const { error } = await c.from("settings").update({
    ann: s.ann, phone: s.phone, free_shipping: s.free, ship_post: s.shipPost, ship_peyk: s.shipPeyk,
  }).eq("id", true);
  if (error) return { ok: false, error: errMsg(error) };
  return { ok: true };
}

/* ── ۶-۹) دسته‌بندی‌ها — برای فرم محصول ادمین (خواندن عمومی) ── */

export async function dbAdminCategories(): Promise<{ ok: boolean; rows: [string, string][]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c.from("categories").select("emoji, name").order("id");
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return { ok: true, rows: ((data ?? []) as { emoji: string; name: string }[]).map((r) => [r.emoji, r.name]) };
}

/* ── ۶-۱۰) مشتریان — ثبت‌نام‌شده‌ها (سیاست profiles_select_own_or_admin) ── */

export async function dbAdminProfiles(): Promise<{ ok: boolean; rows: { name: string; phone: string }[]; error?: string }> {
  const c = db();
  if (!c) return { ok: false, rows: [] };
  const { data, error } = await c.from("profiles").select("name, phone").order("created_at", { ascending: false });
  if (error) return { ok: false, rows: [], error: errMsg(error) };
  return { ok: true, rows: ((data ?? []) as { name: string | null; phone: string | null }[]).map((r) => ({ name: r.name ?? "—", phone: r.phone ?? "—" })) };
}

/* ── ۶-۱۱) کوپن — اعتبارسنجی سمت سرور برای تسویه (RPC امن، مایگریشن ۰۰۰۴) ── */

export type CouponCheck = { valid: boolean; code?: string; percent?: number; max?: number; discount?: number };

export async function dbCheckCoupon(code: string, subtotal: number): Promise<CouponCheck | null> {
  const c = db();
  if (!c) return null;
  const { data, error } = await c.rpc("check_coupon", { p_code: code, p_subtotal: subtotal });
  if (error) return null;
  return (data ?? { valid: false }) as CouponCheck;
}

/* ── ۶-۱۲) اعلان زنده — INSERT سفارش/پیام جدید (Realtime — فقط برای ادمین واردشده) ── */

export function dbAdminLive(
  onNewOrder: () => void,
  onNewMessage: () => void
): () => void {
  const c = db();
  if (!c) return () => {};
  const ch = c
    .channel("adm-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, onNewOrder)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, onNewMessage)
    .subscribe();
  return () => {
    c.removeChannel(ch);
  };
}

/* ── ۶-۱۳) کاتالوگ واقعی برای بازدیدکننده — بارگذاری در بوت سایت ──
   محصولات/بنرها/تنظیمات/نظراتِ تأییدشده از دیتابیس (سیاست‌های عمومی RLS)؛
  fail-soft: در نبود اتصال null برمی‌گردد و کاتالوگ کد مصوب باقی می‌ماند. */

export type CatalogData = {
  prods: Product[];
  banners: Banner[];
  settings: Settings | null;
  reviews: Review[]; // فقط status='ok' (سیاست عمومی)
};

export async function dbFetchCatalog(): Promise<CatalogData | null> {
  const c = db();
  if (!c) return null;
  const [p, b, s, r] = await Promise.all([
    c.from("products").select("id, name, category, emoji, price, old_price, brand, in_stock, rating").order("id"),
    c.from("banners").select("id, title, description, href, bg, active").eq("active", true).order("id"),
    c.from("settings").select("ann, phone, free_shipping, ship_post, ship_peyk").eq("id", true).maybeSingle(),
    c.from("reviews").select("id, product_id, name, text, rating, status").eq("status", "ok").order("created_at", { ascending: false }),
  ]);
  if (p.error && b.error) return null; // هیچ‌کدام نیامد → کاتالوگ کد بماند
  return {
    prods: ((p.data ?? []) as Parameters<typeof rowToProduct>[0][]).map(rowToProduct),
    banners: ((b.data ?? []) as { id: number; title: string; description: string; href: string; bg: string; active: boolean }[]).map((x) => ({
      id: x.id, t: x.title, d: x.description, href: x.href, bg: x.bg, active: x.active,
    })),
    settings: s.data
      ? (() => {
          const v = s.data as { ann: string; phone: string; free_shipping: number; ship_post: number; ship_peyk: number };
          return { ann: v.ann, phone: v.phone, free: v.free_shipping, shipPost: v.ship_post, shipPeyk: v.ship_peyk };
        })()
      : null,
    reviews: ((r.data ?? []) as { id: number; product_id: number; name: string; text: string; rating: string; status: "ok" }[]).map((x) => ({
      id: x.id, pid: x.product_id, name: x.name, text: x.text, r: x.rating, status: "ok",
    })),
  };
}
