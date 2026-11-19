-- ═══ دستور ۴۴ — حریم خصوصی پیامک: پیکربندی پیامک از جدول عمومی settings خارج می‌شود ═══
-- اشکال (تأییدشده با تست نفوذ): سیاست settings_select_public همهٔ ستون‌ها را به anon می‌داد —
-- یعنی هر بازدیدکننده می‌توانست sms_admin_mobile (موبایل مدیر) را بخواند.
-- راه‌حل: جدول اختصاصی sms_config با RLS «فقط ادمین» (بدون هیچ سیاست عمومی)؛
-- سه ستون از settings حذف می‌شود. تابع send-sms با service_role و پنل ادمین با سیاست ادمین می‌خوانند.

create table if not exists public.sms_config (
  id               boolean primary key default true check (id),
  admin_mobile     text    not null default '',
  notify_new_order boolean not null default false,
  notify_status    boolean not null default false,
  updated_at       timestamptz not null default now()
);

comment on table public.sms_config is 'پیکربندی اعلان‌های پیامکی — فقط ادمین (دستور ۴۴)';

alter table public.sms_config enable row level security;

create policy "sms_config_admin_all" on public.sms_config
  for all using (public.is_admin()) with check (public.is_admin());

-- انتقال مقدارهای موجود (اگر ادمین چیزی ثبت کرده بود) و حذف ستون‌های عمومی
insert into public.sms_config (id, admin_mobile, notify_new_order, notify_status)
select true, s.sms_admin_mobile, s.sms_notify_new_order, s.sms_notify_status
from public.settings s
on conflict (id) do update
  set admin_mobile = excluded.admin_mobile,
      notify_new_order = excluded.notify_new_order,
      notify_status = excluded.notify_status,
      updated_at = now();

alter table public.settings
  drop column if exists sms_admin_mobile,
  drop column if exists sms_notify_new_order,
  drop column if exists sms_notify_status;
