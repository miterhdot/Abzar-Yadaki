#!/usr/bin/env python3
# دستور ۴۳ — تست امنیتی زندهٔ لایهٔ پیامک (sms.ir) روی پروژهٔ ساپابیس
# موارد: زنجیرهٔ هوک OTP، اجبار امضای Standard Webhooks، دروازهٔ ادمین، نقش‌ها، ستون‌های جدید
# توکن‌ها فقط از secrets/ — مقادیر محرمانه هرگز چاپ نمی‌شوند.
import base64
import hashlib
import hmac
import json
import re
import sys
import time
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
FN = f"https://{REF}.supabase.co/functions/v1/send-sms"
raw_keys = open("/home/z/my-project/secrets/supabase_project_keys.txt").read()
ANON = re.search(r"anon_key\s*[:=]\s*(\S+)", raw_keys).group(1)
SVC = re.search(r"service[__ ]?role[_key ]*\s*[:=]\s*(\S+)", raw_keys).group(1)
HOOK_SECRET = open("/home/z/my-project/Abzar-Yadaki/secrets/sms_hook_secret.txt").read().strip()

pass_n = 0
fail_n = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global pass_n, fail_n
    mark = "✅" if cond else "❌"
    print(f"{mark} {name}" + (f" — {detail}" if detail and not cond else ""))
    if cond:
        pass_n += 1
    else:
        fail_n += 1


def post(url: str, body: dict, headers: dict, timeout: int = 30):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", **headers},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode()[:300]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def sw_headers(secret: str, body: bytes) -> dict:
    """هدرهای Standard Webhooks با کلید داده‌شده (whsec_ → base64raw)"""
    entry = secret.split(",")[-1]
    key = base64.b64decode(entry.removeprefix("whsec_"))
    wid = str(int(time.time() * 1000))
    wts = str(int(time.time()))
    sig = base64.b64encode(hmac.new(key, f"{wid}.{wts}.".encode() + body, hashlib.sha256).digest()).decode()
    return {"webhook-id": wid, "webhook-timestamp": wts, "webhook-signature": f"v1,{sig}"}


# ۱) دروازهٔ ادمین — بدون توکن
s, d = post(FN, {"action": "status"}, {})
check("بدون توکن → رد ۴۰۱", s == 401 and "ادمین" in d, f"{s} {d}")

# ۲) هوک با امضای غلط — کلید ساختگی
wrong = "v1,whsec_" + base64.b64encode(b"0" * 32).decode()
body = json.dumps({"sms": {"phone": "+989120000000", "otp": "123456"}}).encode()
s, d = post(FN, json.loads(body), sw_headers(wrong, body))
check("هوک با امضای غلط → رد", s == 200 and "امضای" in d, f"{s} {d}")

# ۳) هوک با امضای درست (زنجیرهٔ واقعی OTP) — کلید API تنظیم نشده → خطای شفاف ۵۰۳
s, d = post(FN, json.loads(body), sw_headers(HOOK_SECRET, body))
check("هوک با امضای درست → خطای شفاف نبود کلید", s == 200 and "کلید API" in d, f"{s} {d}")

# ۴) فراخوانی OTP واقعی از گوترِی — همان زنجیره از سطح کلاینت
req = urllib.request.Request(
    f"https://{REF}.supabase.co/auth/v1/otp",
    data=json.dumps({"phone": "+989120000000", "create_user": True}).encode(), method="POST",
    headers={"apikey": ANON, "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        s, d = r.status, r.read().decode()[:200]
except urllib.error.HTTPError as e:
    s, d = e.code, e.read().decode()[:300]
check("signInWithOtp زنده → پیام شفاف نبود کلید", s == 503 and "کلید API" in d, f"{s} {d}")

# ۵) نقش‌ها — JWT سرویس‌رول (بدون ردیف پروفایل) → رد
s, d = post(FN, {"action": "status"}, {"Authorization": f"Bearer {SVC}", "apikey": SVC})
check("service_role بدون پروفایل admin → رد", s == 401, f"{s} {d}")

# ۶) ورود ادمین واقعی → اقدام status مجاز
cred = open("/home/z/my-project/secrets/admin_credentials.txt").read()
email = re.search(r"email:\s*(\S+)", cred).group(1)
password = re.search(r"password:\s*(\S+)", cred).group(1)
req = urllib.request.Request(
    f"https://{REF}.supabase.co/auth/v1/token?grant_type=password",
    data=json.dumps({"email": email, "password": password}).encode(), method="POST",
    headers={"apikey": ANON, "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        tok = json.loads(r.read().decode()).get("access_token", "")
except urllib.error.HTTPError as e:
    print("ادمین لاگین ناموفق:", e.code, e.read().decode()[:200]); sys.exit(1)
s, d = post(FN, {"action": "status"}, {"Authorization": f"Bearer {tok}", "apikey": ANON})
check("ادمین واقعی → وضعیت پیامک ۲۰۰", s == 200, f"{s} {d}")
if s == 200:
    flags = json.loads(d)
    check("وضعیت: کلید تنظیم‌نشده (درست)", flags.get("configured") is False, d)
    check("وضعیت: هوک آماده", flags.get("hookReady") is True, d)

# ۷) اقدام credit برای ادمین (کلید تنظیم نشده → خطای شفاف)
s, d = post(FN, {"action": "credit"}, {"Authorization": f"Bearer {tok}", "apikey": ANON})
check("اعتبار → خطای شفاف نبود کلید", s == 200 and "کلید API" in d, f"{s} {d}")

# ۸) اعلان با toggle خاموش → رد منطقی (نه ارسال)
s, d = post(FN, {"action": "notify", "kind": "new-order", "code": "TEST-000"}, {"Authorization": f"Bearer {tok}", "apikey": ANON})
check("notify با toggle خاموش → رد منطقی", s == 200 and "خاموش" in d, f"{s} {d}")

# ۹) ستون‌های جدید settings از مسیر عمومی
req = urllib.request.Request(
    f"https://{REF}.supabase.co/rest/v1/settings?select=sms_admin_mobile,sms_notify_new_order,sms_notify_status",
    headers={"apikey": ANON},
)
with urllib.request.urlopen(req, timeout=30) as r:
    rows = json.loads(r.read().decode())
check("ستون‌های پیامک در settings زنده", bool(rows) and "sms_notify_new_order" in rows[0], str(rows)[:120])

print(f"\nنتیجه: {pass_n} سبز / {fail_n} قرمز")
sys.exit(1 if fail_n else 0)
