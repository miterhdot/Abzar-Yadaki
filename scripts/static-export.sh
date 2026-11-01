#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# ساخت خروجی استاتیک برای GitHub Pages — دستور ۱۷ (۱۴۰۵/۰۸/۱۰)
# - API مسیرها در خروجی استاتیک پشتیبانی نمی‌شوند؛ موقتاً کنار می‌روند و با trap برمی‌گردند
#   (روی میزبان استاتیک، دستیار AI پیام جایگزین خودِ طراحی را می‌گیرد — مصوبه انتخاب گزینه «ب»)
# - مسیر مطلق فونت در CSS خروجی با basePath اصلاح می‌شود
# - نتیجه: پوشه out/ آماده انتشار
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

export STATIC_EXPORT=1
export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/abzaryadaki}"

API_DIR="src/app/api"
STASH="$(mktemp -d)/api"
restore() { if [ -d "$STASH" ]; then mv "$STASH" "$API_DIR"; fi; }
trap restore EXIT

if [ -d "$API_DIR" ]; then mv "$API_DIR" "$STASH"; fi
rm -rf out
npx next build

# basePath روی url() داخل CSS اعمال نمی‌شود → اصلاح صریح (quoted و unquoted)
find out/_next -name "*.css" -exec sed -i \
  -e "s|url(\"/fonts/|url(\"${NEXT_PUBLIC_BASE_PATH}/fonts/|g" \
  -e "s|url(/fonts/|url(${NEXT_PUBLIC_BASE_PATH}/fonts/|g" {} +

echo "✅ static export ready → out/ (basePath: ${NEXT_PUBLIC_BASE_PATH})"
