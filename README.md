# ابزار یدکی — abzaryadaki.com

فروشگاه اینترنتی ابزار و لوازم یدکی خودرو (نسخه وب‌سایت) با پنل مدیریت کامل.

> **نقش این مخزن: بکاپ.** مخزن عمومی است — هیچ کلید، امضا، رمز یا ماده حساسی در آن قرار نمی‌گیرد (مصوب مدیر، دستور ۱۰).

## ساختار مستندات (`docs/`)

| سند | محتوا |
|-----|-------|
| [`docs/RULES.md`](docs/RULES.md) | قوانین عمومی پروژه (۱۳ بند شامل قانون خروجی) — الزام‌آور |
| [`docs/COMMANDS.md`](docs/COMMANDS.md) | دفتر ثبت دستورات مدیر |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | سیم‌کشی و لایه‌بندی نسخه وب |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | نقشه راه فازبندی‌شده (W1..W5 + موبایل مستقل) |
| [`docs/RELEASES.md`](docs/RELEASES.md) | دفتر خروجی‌ها، پکیج‌نیم، سیاست کلید/امضا |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | گزارش تغییرات |

## فناوری

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zustand (persist) · فونت وزیرمتن · RTL فارسی

## اجرا

```bash
bun install
bun run dev    # http://localhost:3000
bun run lint
bun run build
```

پنل مدیریت: `http://localhost:3000/#admin` — ورود نمایشی: `admin` / `admin123`

## نسخه‌ها

- **نسخه وب‌سایت** = همین مخزن (فعال).
- **نسخه موبایل** = پروژه مستقل آینده؛ کد آن هرگز با این مخزن مخلوط نمی‌شود (قانون ۱).
