#!/usr/bin/env python3
# دستور ۴۳ — راه‌اندازی سرویس پیامک sms.ir روی پروژهٔ ساپابیس
# کارها: ①تنظیم Secrets تابع send-sms ②فعال‌سازی Phone Auth + هوک send_sms با شناسهٔ امنیتی تصادفی
# استفاده (بعد از خرید سرویس و ساخت قالب در پنل sms.ir):
#   python3 scripts/sms_set_key.py --api-key <KEY> --otp-template <ID> [--line <NUM>] [--status-template <ID>] [--otp-param CODE]
#   برای فعال‌سازی صرفاً هوک (بدون کلید): python3 scripts/sms_set_key.py --hook-only
# محرمانه‌ها هرگز چاپ/کامیت نمی‌شوند (مصوبه ۵ و ۶).
import argparse
import base64
import json
import secrets
import sys
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
BASE = "https://api.supabase.com/v1"
SEC = "/home/z/my-project/secrets" if __import__("os").path.exists("/home/z/my-project/secrets/supabase_access_token.txt") else "/home/z/my-project/Abzar-Yadaki/secrets"
tok = open(f"{SEC}/supabase_access_token.txt").read().strip()
URI = f"https://{REF}.supabase.co/functions/v1/send-sms"


def call(method: str, path: str, body=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


ap = argparse.ArgumentParser()
ap.add_argument("--api-key")
ap.add_argument("--otp-template", type=int)
ap.add_argument("--otp-param", default="CODE")
ap.add_argument("--line")
ap.add_argument("--status-template", type=int)
ap.add_argument("--hook-only", action="store_true")
a = ap.parse_args()

# ①) شناسهٔ امنیتی هوک — اگر از قبل هست استفاده، وگرنه ساخت و ذخیرهٔ محلی
hook_secret = ""
try:
    hook_secret = open(f"{SEC}/sms_hook_secret.txt").read().strip()
except FileNotFoundError:
    raw = secrets.token_bytes(32)
    hook_secret = "v1,whsec_" + base64.b64encode(raw).decode()
    open(f"{SEC}/sms_hook_secret.txt", "w").write(hook_secret)
    print("hook secret: ساخته شد (secrets/sms_hook_secret.txt — قالب Standard Webhooks)")

# ②) Secrets تابع
fn_secrets = [{"name": "SMS_HOOK_SECRET", "value": hook_secret}]
if a.api_key:
    fn_secrets.append({"name": "SMS_IR_API_KEY", "value": a.api_key})
if a.otp_template:
    fn_secrets.append({"name": "SMS_OTP_TEMPLATE_ID", "value": str(a.otp_template)})
    fn_secrets.append({"name": "SMS_OTP_PARAM_NAME", "value": a.otp_param})
if a.line:
    fn_secrets.append({"name": "SMS_LINE_NUMBER", "value": a.line})
if a.status_template:
    fn_secrets.append({"name": "SMS_STATUS_TEMPLATE_ID", "value": str(a.status_template)})

if len(fn_secrets) > 1 or a.api_key:
    s, d = call("POST", f"/projects/{REF}/secrets", fn_secrets)
    print("set function secrets:", s, "" if s in (200, 201) else d)
else:
    s, d = call("POST", f"/projects/{REF}/secrets", fn_secrets)
    print("set hook secret:", s, "" if s in (200, 201) else d)

# ③) فعال‌سازی Phone Auth + هوک send_sms
patch = {
    "external_phone_enabled": True,
    "hook_send_sms_enabled": True,
    "hook_send_sms_uri": URI,
    "hook_send_sms_secrets": hook_secret,
    "sms_otp_exp": 60,
    "sms_otp_length": 6,
    "sms_max_frequency": 5,
    "sms_autoconfirm": False,
}
s, d = call("PATCH", f"/projects/{REF}/config/auth", patch)
print("enable phone+hook:", s, "" if s == 200 else d)

# ④) راستی‌آزمایی خواندن مجدد
s, d = call("GET", f"/projects/{REF}/config/auth")
if s == 200 and isinstance(d, dict):
    print("verify external_phone_enabled =", d.get("external_phone_enabled"))
    print("verify hook_send_sms_enabled   =", d.get("hook_send_sms_enabled"))
    print("verify hook_send_sms_uri       =", d.get("hook_send_sms_uri"))
    sec = d.get("hook_send_sms_secrets")
    print("verify hook secret registered  =", bool(sec), "| name:", (sec or [{}])[0].get("name") if isinstance(sec, list) else "؟")
else:
    print("readback failed:", s, d)
    sys.exit(1)
