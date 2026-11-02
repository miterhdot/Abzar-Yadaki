-- ═══════════════════════════════════════════════════════════════════════
--  ابزار یدکی — مایگریشن ۰۰۰۲: دادهٔ اولیه
--  «کپی عینِ مقادیر موجود در کد» (src/data/store.ts) — بدون هیچ دادهٔ جدید
--  سفارش‌ها/مشتریان/نظرات/پیام‌های نمایشی عمداً وارد دیتابیس نمی‌شوند.
-- ═══════════════════════════════════════════════════════════════════════

-- ۱) تنظیمات فروشگاه = عینِ SETTINGS فعلی کد
insert into public.settings (id, ann, phone, free_shipping, ship_post, ship_peyk)
values (true,
        'ارسال رایگان برای خرید بالای ۳ میلیون تومان · ضمانت اصالت کالا',
        '۰۲۱-۰۰۰۰۰۰۰۰ (نمونه)',
        3000000, 80000, 120000)
on conflict (id) do nothing;

-- ۲) دسته‌بندی‌ها = عینِ C فعلی کد
insert into public.categories (emoji, name) values
  ('🛢️', 'فیلتر'),
  ('🛑', 'ترمز'),
  ('🧴', 'روغن'),
  ('⚡', 'برق'),
  ('🔧', 'ابزار'),
  ('🌧️', 'بدنه')
on conflict (name) do nothing;

-- ۳) محصولات = عینِ P فعلی کد (۱۶ قطعه) — با گارد تکرارناپذیری
insert into public.products (name, category, emoji, price, old_price, brand, in_stock, rating)
select name, category, emoji, price, old_price, brand, in_stock, rating
from (values
  ('فیلتر روغن پراید و تیبا',        'فیلتر', '🛢️',  185000,  220000, 'سایپا یدک', true,  '۴٫۸'),
  ('لنت ترمز جلو پژو ۲۰۶',           'ترمز',  '🛑',  690000,  790000, 'بوش',       true,  '۴٫۹'),
  ('روغن موتور ۵W-30 چهار لیتری',    'روغن',  '🧴', 1450000,       0, 'ایرانول',   false, '۴٫۷'),
  ('شمع موتور سوزنی (ست ۴ تایی)',    'برق',   '⚡',  540000,  620000, 'NGK',       true,  '۴٫۸'),
  ('ست آچار بکس ۴۶ عددی',            'ابزار', '🔧', 2350000, 2900000, 'رونیکس',    true,  '۴٫۶'),
  ('تیغه برف‌پاک‌کن سیلیکونی',        'بدنه',  '🌧️',  320000,       0, 'بوش',       false, '۴٫۵'),
  ('فیلتر هوا ۲۰۶ تیپ ۲',            'فیلتر', '💨',  260000,  310000, 'مان',       true,  '۴٫۷'),
  ('جک روغنی ۲ تن',                  'ابزار', '🏗️', 3100000,       0, 'توسن',      false, '۴٫۴'),
  ('باتری ۶۰ آمپر',                  'برق',   '🔋', 3950000, 4400000, 'سپاهان',    true,  '۴٫۶'),
  ('دیسک ترمز جلو سمند',             'ترمز',  '💿', 1250000,       0, 'بوش',       false, '۴٫۷'),
  ('فیلتر کابین ضدحساسیت',           'فیلتر', '🌬️',  210000,  250000, 'مان',       true,  '۴٫۵'),
  ('پمپ باد فندکی ۱۲ ولت',           'ابزار', '🎈',  890000, 1050000, 'توسن',      true,  '۴٫۴'),
  ('اسپری گریس و روان‌کننده',        'روغن',  '🧪',  140000,       0, 'WD-40',     false, '۴٫۸'),
  ('کاور ضدآب خودرو',                'بدنه',  '🚗',  760000,       0, 'پارس',      false, '۴٫۳'),
  ('چراغ مه‌شکن LED',                'برق',   '💡', 1380000, 1600000, 'اسرام',     true,  '۴٫۶'),
  ('جعبه‌ابزار ۳ طبقه',              'ابزار', '🧰', 1950000,       0, 'رونیکس',    false, '۴٫۵')
) as v(name, category, emoji, price, old_price, brand, in_stock, rating)
where not exists (select 1 from public.products);

-- ۴) کوپن‌ها = عینِ COUPONS فعلی کد
insert into public.coupons (code, percent, max, active) values
  ('WELCOME', 10,  500000, true),
  ('ABZAR20', 20, 1000000, true),
  ('OLDBOY5',  5,  200000, false)
on conflict (code) do nothing;

-- ۵) بنرها = عینِ BANNERS فعلی کد — با گارد تکرارناپذیری
insert into public.banners (title, description, href, bg, active, sort)
select title, description, href, bg, active, sort
from (values
  ('⚡ تخفیف ویژه امروز', 'قطعات منتخب با قیمت شگفت‌انگیز', '#offers', 'linear-gradient(135deg,#ff6a1a,#c2410c)', true,  1),
  ('🔧 ابزار حرفه‌ای',     'آچار، جک و تجهیزات کارگاهی',     '#cats',   'linear-gradient(135deg,#143a66,#0b1f3a)', true,  2)
) as v(title, description, href, bg, active, sort)
where not exists (select 1 from public.banners);
