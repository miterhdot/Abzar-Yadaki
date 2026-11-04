-- ═══════════════════════════════════════════════════════════════════════
--  ابزار یدکی — مایگریشن ۰۰۰۴: پشتیبانی پنل ادمین (فاز D3 — دستور ۲۵)
--  ۱) شمارش استفادهٔ کوپن (used_count + تریگر روی ثبت سفارش)
--  ۲) RPC امن check_coupon — اعتبارسنجی کوپن در تسویه بدون افشای جدول کوپن‌ها
--  ۳) Realtime برای اعلان زندهٔ سفارش/پیام جدید در پنل ادمین
--  اصول ثابت: RLS پابرجاست · هیچ دسترسی عمومی جدیدی به دادهٔ حساس داده نمی‌شود
-- ═══════════════════════════════════════════════════════════════════════

-- ── ۱) شمارش استفادهٔ کوپن ─────────────────────────────────────────────
alter table public.coupons add column if not exists used_count int not null default 0;

-- تریگر: با هر سفارشِ دارای کوپن، شمارندهٔ استفاده +۱ می‌شود.
-- (درج سفارش فقط از create_order امن انجام می‌شود که security definer است؛
--  بنابراین این تریگر در همان زمینهٔ امن اجرا می‌شود.)
create or replace function public.coupon_used_bump()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = new.coupon_code;
  end if;
  return null;
end;
$$;

drop trigger if exists orders_coupon_bump on public.orders;
create trigger orders_coupon_bump
  after insert on public.orders
  for each row execute function public.coupon_used_bump();

-- ── ۲) اعتبارسنجی کوپن برای تسویه (قبل از ثبت سفارش) ───────────────────
--     جدول کوپن‌ها همچنان کاملاً بسته است؛ این تابع فقط «نتیجهٔ» اعتبارسنجی
--     را برمی‌گرداند (درصد/سقف/مبلغ تخفیف برای همان سبد). کد نامعتبر و
--     کد ناموجود هر دو پاسخ یکسان می‌دهند (ضد شناسایی کدها با پیام).
create or replace function public.check_coupon(p_code text, p_subtotal bigint)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_coupon   public.coupons%rowtype;
  v_discount bigint;
begin
  if p_code is null or btrim(p_code) = '' or p_subtotal is null or p_subtotal <= 0 then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;
  if char_length(btrim(p_code)) > 40 then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;
  select * into v_coupon from public.coupons where code = upper(btrim(p_code));
  if not found or not v_coupon.active then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;
  v_discount := least(p_subtotal * v_coupon.percent / 100, v_coupon.max);
  return jsonb_build_object(
    'valid',    true,
    'code',     v_coupon.code,
    'percent',  v_coupon.percent,
    'max',      v_coupon.max,
    'discount', v_discount
  );
end;
$$;

grant execute on function public.check_coupon(text, bigint) to anon, authenticated;

-- ── ۳) Realtime برای اعلان زندهٔ پنل ادمین ─────────────────────────────
--     رخدادهای INSERT جدول سفارش‌ها و پیام‌های تماس؛ RLS حکم می‌کند که
--     فقط ادمینِ واردشده این رخدادها را دریافت کند (بازدیدکننده هیچ‌چیز).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contact_messages'
  ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
end $$;
