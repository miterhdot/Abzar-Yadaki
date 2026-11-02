-- ═══════════════════════════════════════════════════════════════════════
--  ابزار یدکی — مایگریشن ۰۰۰۳: تابع امن پیگیری سفارش (فاز D2 — دستور ۲۴)
--  چرا این تابع؟ سیاست RLS سفارش‌ها فقط به مالک/ادمین اجازهٔ خواندن می‌دهد؛
--  مهمان (بدون نشست) با «کد پیگیری + موبایل» می‌تواند «فقط سفارش خودش» را ببیند.
--  امنیت: تطبیق هم‌زمان کد و موبایل · پیام خطای یکسان برای «کد اشتباه» و
--  «موبایل اشتباه» (ضد شناسایی) · نرمال‌سازی ارقام فارسی/عربی به لاتین
--  با دو translate جداگانهٔ ۱۰↔۱۰ (بدون حذف خط تیرهٔ خودِ کد) و پاک‌سازی
--  نویسه‌های غیر حرف/رقم با regexp_replace.
--  ریسک باقیمانده (ثبت‌شده در docs/DATABASE.md): سرعت‌محدودیت سطح اپ
--  اعمال می‌شود؛ حدس موبایل برای یک کد معلوم عملاً ۱۰ رقم است.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.track_order(p_code text, p_phone text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_norm_code  text;
  v_norm_phone text;
  v_order      public.orders%rowtype;
  v_items      jsonb;
begin
  -- ── کد پیگیری: پیشوند برداشته می‌شود، ارقام فارسی/عربی لاتین می‌شوند،
  --    هر نویسهٔ غیر حرف/رقم (فاصله، خط تیره، نیم‌فاصله…) پاک می‌شود.
  v_norm_code := upper(btrim(coalesce(p_code, '')));
  v_norm_code := regexp_replace(v_norm_code, '^AY[-\s]*', '');
  v_norm_code := translate(v_norm_code, '۰۱۲۳۴۵۶۷۸۹', '0123456789');
  v_norm_code := translate(v_norm_code, '٠١٢٣٤٥٦٧٨٩', '0123456789');
  v_norm_code := regexp_replace(v_norm_code, '[^A-Z0-9]', '', 'g');
  if v_norm_code = '' then
    return null;
  end if;
  v_norm_code := 'AY-' || v_norm_code;

  -- ── موبایل: فقط ارقام لاتین باقی می‌ماند.
  v_norm_phone := regexp_replace(
    translate(
      translate(btrim(coalesce(p_phone, '')), '۰۱۲۳۴۵۶۷۸۹', '0123456789'),
      '٠١٢٣٤٥٦٧٨٩', '0123456789'),
    '[^0-9]', '', 'g');
  if v_norm_phone = '' then
    return null;
  end if;

  select * into v_order from public.orders where code = v_norm_code;
  if not found then
    return null;  -- پیام یکسان: کد یا موبایل نادرست
  end if;

  -- مقایسهٔ موبایل ذخیره‌شده با همان نرمال‌سازی (دادهٔ ورودی ممکن است فارسی باشد)
  if regexp_replace(
       translate(
         translate(coalesce(v_order.phone, ''), '۰۱۲۳۴۵۶۷۸۹', '0123456789'),
         '٠١٢٣٤٥٦٧٨٩', '0123456789'),
       '[^0-9]', '', 'g') <> v_norm_phone then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', oi.product_id,
           'name',       pr.name,
           'emoji',      pr.emoji,
           'qty',        oi.qty,
           'price_at_order', oi.price_at_order
         ) order by oi.id), '[]'::jsonb)
    into v_items
    from public.order_items oi
    join public.products pr on pr.id = oi.product_id
   where oi.order_id = v_order.id;

  return jsonb_build_object(
    'code',        v_order.code,
    'name',        v_order.name,
    'phone',       v_order.phone,
    'status',      v_order.status,
    'subtotal',    v_order.subtotal,
    'shipping',    v_order.shipping,
    'discount',    v_order.discount,
    'total',       v_order.total,
    'pay',         v_order.pay,
    'ship',        v_order.ship,
    'addr',        v_order.addr,
    'created_at',  v_order.created_at,
    'items',       v_items
  );
end;
$$;

-- مجوز اجرا (همان الگوی create_order)
grant execute on function public.track_order(text, text) to anon, authenticated;
