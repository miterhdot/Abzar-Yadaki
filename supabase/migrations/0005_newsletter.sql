-- دستور ۴۲/فاز M2 — خبرنامهٔ بومی (پیشنهاد ۳/M2): عضویت عمومی با اعتبارسنجی، خواندن فقط ادمین
create table if not exists public.newsletter (
  id bigint generated always as identity primary key,
  contact text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_created_idx on public.newsletter (created_at desc);
alter table public.newsletter enable row level security;

-- عضویت عمومی: ایمیل یا موبایل ایرانی ۱۱ رقمی (۰۹...) — نرمال‌سازی سمت سرورِ API انجام می‌شود
create policy "newsletter_insert_public" on public.newsletter
  for insert with check (
    contact ~ '^\S+@\S+\.\S+$'
    or contact ~ '^09\d{9}$'
  );

-- خواندن/حذف فقط ادمین (همان الگوی پیام‌های تماس)
create policy "newsletter_admin_all" on public.newsletter
  for all using (public.is_admin()) with check (public.is_admin());
