"use client";

/* ── لایهٔ اتصال به دیتابیس Supabase — فاز D2 (دستور ۲۴) ──
 * فقط با کلید عمومی anon (به مرورگر می‌رود) — امنیت با RLS و توابع امن سمت سرور.
 * هیچ کلید service_role در کد سمت کلاینت/وب وجود ندارد.
 * همهٔ توابع fail-soft هستند: اگر دیتابیس در دسترس نباشد، مقدار null/خطا برمی‌گردد
 * و نماها به رفتار نمایشی مصوب (مصوبه ۱۰) برمی‌گردند.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus } from "@/data/store";

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
