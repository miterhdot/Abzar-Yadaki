-- ═══ دستور ۴۳ — پیکربندی پیامک (سرویس sms.ir) ═══
-- سه ستون جدید روی جدول تنظیمات تک‌سطری؛ سیاست‌های RLS موجود (settings_admin_all)
-- به‌روزرسانی این ستون‌ها را هم برای ادمین پوشش می‌دهد — هیچ سیاست جدیدی باز نمی‌شود.

alter table public.settings
  add column if not exists sms_admin_mobile     text    not null default '',
  add column if not exists sms_notify_new_order boolean not null default false,
  add column if not exists sms_notify_status    boolean not null default false;

comment on column public.settings.sms_admin_mobile is 'موبایل مدیر برای اعلان سفارش جدید (فرم 09xxxxxxxxx)';
comment on column public.settings.sms_notify_new_order is 'اطلاع‌رسانی پیامکی سفارش جدید به مدیر';
comment on column public.settings.sms_notify_status is 'اطلاع‌رسانی پیامکی تغییر وضعیت سفارش به مشتری';
