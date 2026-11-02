-- ═══════════════════════════════════════════════════════════════════════
--  ابزار یدکی — مایگریشن ۰۰۰۱: اسکیمای پایگاه داده + استانداردهای امنیتی
--  (دستور ۲۲ مدیر — ۱۴۰۵/۰۸/۱۱) — پروژهٔ Supabase: wdbixiercvkshmamobro
--  اصول: RLS روی همهٔ جدول‌ها (پیش‌فرض: رد) · بدون رمز خام در دیتابیس
--        (هش رمز = Supabase Auth/bcrypt) · قیمت سفارش فقط سمت سرور
-- ═══════════════════════════════════════════════════════════════════════

-- ── ۱) جدول‌ها ─────────────────────────────────────────────────────────

-- ۱-۱) دسته‌بندی‌ها (آینهٔ C در store.ts)
create table if not exists public.categories (
  id          bigint generated always as identity primary key,
  emoji       text not null,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ۱-۲) محصولات (آینهٔ Product در store.ts)
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null,
  category    text not null references public.categories(name) on update cascade,
  emoji       text not null default '🔧',
  price       bigint not null check (price >= 0),
  old_price   bigint not null default 0 check (old_price >= 0),
  brand       text not null,
  in_stock    boolean not null default true,
  rating      text check (rating is null or char_length(rating) <= 4),  -- متن فارسی امتیاز مثل ۴٫۸
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ۱-۳) بنرها (آینهٔ BANNERS)
create table if not exists public.banners (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text not null,
  href        text not null,
  bg          text not null,
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- ۱-۴) کوپن‌ها (آینهٔ COUPONS) — بدون سیاست عمومی: فقط ادمین می‌بیند؛ اعتبارسنجی در تابع create_order
create table if not exists public.coupons (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  percent     int not null check (percent between 1 and 100),
  max         bigint not null default 0 check (max >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ۱-۵) پروفایل کاربران — متصل به auth.users
--     «هش‌گذاری رمز»: هیچ ستون رمزی نداریم؛ رمزها فقط در Supabase Auth
--     با bcrypt هش می‌شوند و ورود با کد یکبارمصرف پیامکی است.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  phone       text unique,
  role        text not null default 'customer' check (role in ('customer','admin')),
  created_at  timestamptz not null default now()
);

-- ۱-۶) آدرس‌های کاربر (آینهٔ ADDRESSES)
create table if not exists public.addresses (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  phone       text not null,
  title       text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- ۱-۷) سفارش‌ها (آینهٔ ORDERS + قیمت‌گذاری تفکیکی)
create table if not exists public.orders (
  id           bigint generated always as identity primary key,
  code         text not null unique,
  user_id      uuid references public.profiles(id) on delete set null,
  name         text not null,
  phone        text not null,
  items_count  int not null default 0,
  subtotal     bigint not null default 0 check (subtotal >= 0),
  shipping     bigint not null default 0 check (shipping >= 0),
  discount     bigint not null default 0 check (discount >= 0),
  total        bigint not null default 0 check (total >= 0),
  status       text not null default 'processing'
               check (status in ('processing','sent','done','canceled')),
  pay          text not null default 'online' check (pay in ('online','cod')),
  ship         text not null default 'post' check (ship in ('post','peyk')),
  addr         text,
  coupon_code  text references public.coupons(code) on update cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ۱-۸) ردیف‌های سفارش (آینهٔ lines) — قیمت لحظهٔ سفارش عیناً ثبت می‌شود
create table if not exists public.order_items (
  id              bigint generated always as identity primary key,
  order_id        bigint not null references public.orders(id) on delete cascade,
  product_id      bigint not null references public.products(id),
  qty             int not null check (qty between 1 and 100),
  price_at_order  bigint not null check (price_at_order >= 0)
);

-- ۱-۹) علاقه‌مندی‌ها
create table if not exists public.wishlist (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ۱-۱۰) نظرات (آینهٔ REVIEWS_QUEUE — صف تأیید ادمین)
create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  name        text not null,
  text        text not null check (char_length(text) between 3 and 1000),
  rating      text not null check (rating in ('۱','۲','۳','۴','۵')),
  status      text not null default 'pending' check (status in ('pending','ok','no')),
  created_at  timestamptz not null default now()
);

-- ۱-۱۱) پیام‌های تماس با ما (آینهٔ MSGS) — ثبت برای بازدیدکنندهٔ عمومی، خواندن فقط ادمین
create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null,
  phone       text not null,
  subject     text not null,
  text        text not null,
  unread      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ۱-۱۲) تنظیمات فروشگاه (آینهٔ SETTINGS — تک‌سطری)
create table if not exists public.settings (
  id             boolean primary key default true check (id = true),
  ann            text not null default '',
  phone          text not null default '',
  free_shipping  bigint not null default 3000000 check (free_shipping >= 0),
  ship_post      bigint not null default 80000 check (ship_post >= 0),
  ship_peyk      bigint not null default 120000 check (ship_peyk >= 0),
  updated_at     timestamptz not null default now()
);

-- ── ۲) نمایه‌ها (بازیابی سریع) ─────────────────────────────────────────
create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx    on public.products (brand);
create index if not exists orders_user_idx       on public.orders (user_id);
create index if not exists orders_created_idx    on public.orders (created_at desc);
create index if not exists orders_phone_idx      on public.orders (phone);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists reviews_product_idx   on public.reviews (product_id);
create index if not exists addresses_user_idx    on public.addresses (user_id);
create index if not exists messages_created_idx  on public.contact_messages (created_at desc);

-- ── ۳) توابع امنیتی ────────────────────────────────────────────────────

-- ۳-۱) تشخیص ادمین (از توکن احرازهویت فراخواننده)
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ۳-۲) ساخت خودکار پروفایل پس از ثبت‌نام (تلفن و نام از احرازهویت)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, name)
  values (
    new.id,
    nullif(btrim(coalesce(new.phone, '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ۳-۳) به‌روزرسانی خودکار updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ۳-۴) ثبت سفارش — فقط از این تابع (ضد دستکاری قیمت سمت کلاینت):
--      مجموع، هزینهٔ ارسال و تخفیف «همیشه» بر اساس جدول محصولات/تنظیمات/کوپن‌های
--      همین دیتابیس محاسبه می‌شود؛ ورودی کلاینت فقط شناسهٔ کالا و تعداد است.
create or replace function public.create_order(
  p_name   text,
  p_phone  text,
  p_items  jsonb,
  p_pay    text default 'online',
  p_ship   text default 'post',
  p_addr   text default null,
  p_coupon text default null
)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_item      jsonb;
  v_pid       bigint;
  v_qty       int;
  v_price     bigint;
  v_subtotal  bigint := 0;
  v_shipping  bigint := 0;
  v_discount  bigint := 0;
  v_total     bigint;
  v_free      bigint;
  v_post      bigint;
  v_peyk      bigint;
  v_coupon    public.coupons%rowtype;
  v_order_id  bigint;
  v_code      text;
  v_count     int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'سبد خرید خالی است';
  end if;
  v_count := jsonb_array_length(p_items);
  if v_count > 50 then
    raise exception 'تعداد اقلام سفارش بیش از حد مجاز است';
  end if;
  if p_name is null or char_length(btrim(p_name)) < 2 or char_length(btrim(p_name)) > 80 then
    raise exception 'نام خریدار نامعتبر است';
  end if;
  if p_phone is null or char_length(btrim(p_phone)) < 10 or char_length(btrim(p_phone)) > 15 then
    raise exception 'شماره تماس نامعتبر است';
  end if;
  if p_pay not in ('online','cod') then
    raise exception 'روش پرداخت نامعتبر است';
  end if;
  if p_ship not in ('post','peyk') then
    raise exception 'روش ارسال نامعتبر است';
  end if;
  if p_addr is not null and char_length(btrim(p_addr)) > 500 then
    raise exception 'نشانی بیش از حد طولانی است';
  end if;

  for v_item in select e from jsonb_array_elements(p_items) e loop
    v_pid := (v_item->>'id')::bigint;
    v_qty := (v_item->>'qty')::int;
    if v_pid is null or v_qty is null or v_qty < 1 or v_qty > 100 then
      raise exception 'اقلام سفارش نامعتبر است';
    end if;
    select price into v_price from public.products where id = v_pid;
    if v_price is null then
      raise exception 'محصول #% یافت نشد', v_pid;
    end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  select free_shipping, ship_post, ship_peyk into v_free, v_post, v_peyk
  from public.settings where id = true;
  v_shipping := case when p_ship = 'peyk' then v_peyk else v_post end;
  if v_subtotal >= v_free then
    v_shipping := 0;
  end if;

  if p_coupon is not null and btrim(p_coupon) <> '' then
    select * into v_coupon from public.coupons where code = upper(btrim(p_coupon));
    if not found or not v_coupon.active then
      raise exception 'کد تخفیف نامعتبر است';
    end if;
    v_discount := least(v_subtotal * v_coupon.percent / 100, v_coupon.max);
  end if;

  v_total := v_subtotal + v_shipping - v_discount;

  loop
    v_code := 'AY-' || upper(
      substr(
        translate(encode(extensions.gen_random_bytes(6), 'base64'), '+/=', 'xxy'),
        1, 6
      )
    );
    exit when not exists (select 1 from public.orders where code = v_code);
  end loop;

  insert into public.orders
    (code, user_id, name, phone, items_count, subtotal, shipping, discount, total, pay, ship, addr, coupon_code)
  values
    (v_code, auth.uid(), btrim(p_name), btrim(p_phone), v_count,
     v_subtotal, v_shipping, v_discount, v_total, p_pay, p_ship,
     nullif(btrim(coalesce(p_addr, '')), ''),
     case when p_coupon is not null and btrim(p_coupon) <> '' then upper(btrim(p_coupon)) else null end)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, qty, price_at_order)
  select v_order_id,
         (e->>'id')::bigint,
         (e->>'qty')::int,
         pr.price
  from jsonb_array_elements(p_items) e
  join public.products pr on pr.id = (e->>'id')::bigint;

  return v_code;
end;
$$;

-- ── ۴) امنیت سطح ردیف (RLS) — پیش‌فرض: همه‌چیز رد می‌شود ────────────────

alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.banners           enable row level security;
alter table public.coupons           enable row level security;
alter table public.profiles          enable row level security;
alter table public.addresses         enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.wishlist          enable row level security;
alter table public.reviews           enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.settings          enable row level security;

-- ۴-۱) محصولات / دسته‌بندی‌ها: خواندن عمومی، نوشتن فقط ادمین
create policy "products_select_public" on public.products
  for select using (true);
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "categories_select_public" on public.categories
  for select using (true);
create policy "categories_admin_all" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۲) بنرها: عمومی فقط بنر فعال، ادمین همه
create policy "banners_select_public" on public.banners
  for select using (active or public.is_admin());
create policy "banners_admin_all" on public.banners
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۳) تنظیمات: خواندن عمومی (نمایش هزینهٔ ارسال)، نوشتن فقط ادمین
create policy "settings_select_public" on public.settings
  for select using (true);
create policy "settings_admin_all" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۴) کوپن‌ها: هیچ دسترسی عمومی — فقط ادمین (اعتبارسنجی در create_order)
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۵) پروفایل‌ها: هر کاربر فقط خودش؛ ادمین همه
--     (ستون role با مجوز ستونی از نوشتن کاربران عادی خارج است — ضد ارتقای نقش)
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update on table public.profiles from authenticated;
grant update (name, phone) on table public.profiles to authenticated;

-- ۴-۶) آدرس‌ها و علاقه‌مندی‌ها: فقط مالک + ادمین
create policy "addresses_own_all" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_admin_all" on public.addresses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "wishlist_own_all" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_admin_all" on public.wishlist
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۷) سفارش‌ها: خواندن مالک/ادمین؛ تغییر وضعیت فقط ادمین؛
--     «درج مستقیم ممنوع» — ثبت فقط با تابع امن create_order
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_select_admin" on public.orders
  for select using (public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_delete" on public.orders
  for delete using (public.is_admin());

create policy "order_items_select_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items_select_admin" on public.order_items
  for select using (public.is_admin());

-- ۴-۸) نظرات: عمومی فقط تأییدشده‌ها؛ ثبت فقط کاربر واردشده (در صف انتظار)؛ مدیریت ادمین
create policy "reviews_select_approved" on public.reviews
  for select using (status = 'ok');
create policy "reviews_select_admin" on public.reviews
  for select using (public.is_admin());
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id and status = 'pending');
create policy "reviews_admin_all" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ۴-۹) پیام‌های تماس: هر بازدیدکننده‌ای می‌تواند پیام بفرستد (با اعتبارسنجی طول)،
--     خواندن/تغییر/حذف فقط ادمین
create policy "messages_insert_public" on public.contact_messages
  for insert with check (
    char_length(btrim(name))    between 2 and 80  and
    char_length(btrim(phone))   between 10 and 15 and
    char_length(btrim(subject)) between 2 and 100 and
    char_length(btrim(text))    between 5 and 2000
  );
create policy "messages_admin_all" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());
