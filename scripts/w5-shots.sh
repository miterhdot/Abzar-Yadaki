#!/usr/bin/env bash
# W5 — عکاسی از نماها: برای هر «hash|نام» → باز کردن، انتظار رندر، اسکرین‌شات فول‌پیج
# استفاده: w5-shots.sh desktop|mobile "hash|slug" [more pairs...]
set -u
MODE="$1"; shift
DIR="/home/z/my-project/download/w5-review/$MODE"
ok=0; fail=0
for pair in "$@"; do
  hash="${pair%%|*}"; slug="${pair##*|}"
  url="http://localhost:3000/#${hash}"
  if agent-browser open "$url" >/dev/null 2>&1 \
     && agent-browser wait --load networkidle >/dev/null 2>&1 \
     && agent-browser wait 1200 >/dev/null 2>&1 \
     && agent-browser screenshot --full "$DIR/$slug.png" >/dev/null 2>&1; then
    echo "OK   $slug ($(stat -c%s "$DIR/$slug.png" 2>/dev/null) bytes)"
    ok=$((ok+1))
  else
    echo "FAIL $slug"; fail=$((fail+1))
  fi
done
echo "--- done: ok=$ok fail=$fail"
