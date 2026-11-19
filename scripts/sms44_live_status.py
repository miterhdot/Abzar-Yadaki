#!/usr/bin/env python3
# دستور ۴۴ — بررسی زندهٔ وضعیت لایهٔ پیامک: کلید/قالب، نشت ستون‌های SMS، رمز هوک، پیکربندی Auth
# مقادیر محرمانه هرگز چاپ نمی‌شوند؛ فقط وضعیت‌های بولی و نام‌ها.
import json
import re
import sys
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
BASE = f"https://{REF}.supabase.co"
raw_keys = open("/home/z/my-project/secrets/supabase_project_keys.txt").read()
ANON = re.search(r"anon_key\s*[:=]\s*(\S+)", raw_keys).group(1)
SB_URL = re.search(r"supabase_url\s*[:=]\s*(\S+)", raw_keys).group(1)
ADM = open("/home/z/my-project/secrets/admin_credentials.txt").read()
ADM_EMAIL = re.search(r"email\s*[:=]\s*(\S+)", ADM).group(1)
ADM_PASS = re.search(r"temp_password\s*[:=]\s*(\S+)", ADM).group(1)
SAT = open("/home/z/my-project/secrets/supabase_access_token.txt").read().strip()


def req(url: str, method="GET", body=None, headers=None, timeout=30):
    h = {"Content-Type": "application/json", "Accept": "application/json", **(headers or {})}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)


print("═" * 20, "۱) ورود ادمین (GoTrue)", "═" * 20)
st, body = req(f"{SB_URL}/auth/v1/token?grant_type=password", "POST",
               {"email": ADM_EMAIL, "password": ADM_PASS}, {"apikey": ANON})
print("login status:", st)
jwt = ""
if st == 200:
    sess = json.loads(body)
    jwt = sess.get("access_token", "")
    print("admin role claim ok:", bool(jwt))

print("═" * 20, "۲) action=status با JWT ادمین", "═" * 20)
st, body = req(f"{BASE}/functions/v1/send-sms", "POST", {"action": "status"},
               {"apikey": ANON, "Authorization": f"Bearer {jwt}"})
print("status:", st, body[:300])

print("═" * 20, "۳) action=credit با JWT ادمین", "═" * 20)
st, body = req(f"{BASE}/functions/v1/send-sms", "POST", {"action": "credit"},
               {"apikey": ANON, "Authorization": f"Bearer {jwt}"})
print("credit:", st, body[:300])

print("═" * 20, "۴) نشت ستون‌های SMS از REST عمومی (با کلید anon)", "═" * 20)
st, body = req(f"{SB_URL}/rest/v1/settings?select=id,sms_admin_mobile,sms_notify_new_order,sms_notify_status", 
               headers={"apikey": ANON, "Authorization": f"Bearer {ANON}"})
try:
    rows = json.loads(body)
    if isinstance(rows, list) and rows:
        mob = rows[0].get("sms_admin_mobile", "")
        masked = (mob[:4] + "****" + mob[-2:] + f" (len={len(mob)})") if mob else "(خالی)"
        print("anon REST خواند موبایل مدیر؟", "بله — LEAK:", masked)
        print("toggles:", rows[0].get("sms_notify_new_order"), rows[0].get("sms_notify_status"))
    else:
        print("بدنه:", body[:200])
except Exception:
    print("بدنه:", body[:200])

print("═" * 20, "۵) رمزهای تابع از API مدیریت (فقط نام‌ها)", "═" * 20)
st, body = req(f"https://api.supabase.com/v1/projects/{REF}/functions/send-sms/secrets",
               headers={"Authorization": f"Bearer {SAT}"})
print("mgmt status:", st)
names = []
vals = {}
try:
    arr = json.loads(body)
    if isinstance(arr, list):
        for s in arr:
            n = s.get("name", "?")
            names.append(n)
            if isinstance(s.get("value"), str) and s["value"]:
                vals[n] = s["value"]
    print("secret names:", names)
except Exception:
    print("بدنه:", body[:200])

# اگر رمز هوک خوانا بود، در secrets محلی ذخیره (برای تست امضا) — مقدار چاپ نمی‌شود
if "SMS_HOOK_SECRET" in vals:
    open("/home/z/my-project/secrets/sms_hook_secret.txt", "w").write(vals["SMS_HOOK_SECRET"])
    print("SMS_HOOK_SECRET خوانا شد → در secrets محلی ذخیره شد")
else:
    print("SMS_HOOK_SECRET خوانا نیست (یا مقدار بازنمی‌گردد)")

print("═" * 20, "۶) پیکربندی Auth — Phone/هوک/محدودیت (بدون مقدارهای محرمانه)", "═" * 20)
st, body = req(f"https://api.supabase.com/v1/projects/{REF}/config/auth",
               headers={"Authorization": f"Bearer {SAT}"})
if st == 200:
    cfg = json.loads(body)
    safe_keys = [
        "external_phone_enabled", "hook_send_sms_enabled", "hook_send_sms_uri",
        "hook_send_sms_version", "sms_provider", "sms_autoconfirm",
        "sms_max_frequency", "sms_otp_validity", "sms_otp_length",
        "rate_limit_sms_sent", "rate_limit_verify", "rate_limit_otp_sent",
        "phone_rate_limit", "sms_rate_limit", "external_phone_otp_length",
        "external_phone_otp_exp", "mailer_autoconfirm", "disable_signup",
    ]
    for k in safe_keys:
        if k in cfg:
            v = cfg[k]
            if isinstance(v, str) and ("secret" in k.lower() or len(v) > 60):
                v = "<REDACTED>"
            print(f"  {k} = {v}")
else:
    print("auth config status:", st, body[:120])
