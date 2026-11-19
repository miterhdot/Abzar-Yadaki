#!/usr/bin/env python3
# ═══ دستور ۴۴ — چالش «دریافت پیامک»: زنجیرهٔ کامل واقعی OTP تا گوشی ═══
# اجرا پس از ثبت کلید و قالب (python3 scripts/sms_set_key.py --api-key ... --otp-template ...)
#   python3 -I scripts/sms44_challenge.py --mobile 09xxxxxxxxx
# مراحل: درخواست OTP واقعی → هوک GoTrue → تابع امن → sms.ir → دریافت کد از کاربر → تأیید → نشست
import json
import re
import sys
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
BASE = f"https://{REF}.supabase.co"
raw_keys = open("/home/z/my-project/secrets/supabase_project_keys.txt").read()
ANON = re.search(r"anon_key\s*[:=]\s*(\S+)", raw_keys).group(1)

mobile = ""
if "--mobile" in sys.argv:
    mobile = sys.argv[sys.argv.index("--mobile") + 1]
mobile = mobile.strip() or "09123456789"
d = mobile.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")).translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
d = re.sub(r"\D", "", d)
if d.startswith("0098"):
    d = d[4:]
elif d.startswith("98") and len(d) >= 12:
    d = d[2:]
if d.startswith("0"):
    d = d[1:]
if not re.fullmatch(r"9\d{9}", d):
    print("❌ شمارهٔ موبایل ایران معتبر نیست — مثال: --mobile 09121234567")
    sys.exit(1)
e164 = "+98" + d
masked = "0" + d[:3] + "****" + d[-3:]
print("چالش دریافت پیامک برای شماره:", masked)


def req(url, body, headers):
    r = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                               headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(r, timeout=45) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)


print("\nگام ۱ — درخواست کد ورود پیامکی (signInWithOtp) ...")
st, body = req(f"{BASE}/auth/v1/otp", {"phone": e164, "create_user": True}, {"apikey": ANON})
print("   پاسخ:", st, body[:220])
if st != 200:
    print("\n❌ کد ارسال نشد — پیام خطا بالا (احتمالاً کلید/قالب تنظیم نشده یا شماره در فهرست سیاه است)")
    sys.exit(1)
print("   ✅ درخواست پذیرفته شد — پیامک در راه است (چند ثانیه صبر کنید)")

code = input("\nگام ۲ — کد ۶ رقمی دریافتی در پیامک را وارد کنید: ").strip()
code = code.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
if not re.fullmatch(r"\d{4,8}", code):
    print("❌ کد نامعتبر")
    sys.exit(1)

print("\nگام ۳ — تأیید کد (verifyOtp) ...")
st, body = req(f"{BASE}/auth/v1/verify", {"phone": e164, "token": code, "type": "sms"}, {"apikey": ANON})
if st == 200:
    sess = json.loads(body)
    uid = sess.get("user", {}).get("id", "")
    phone_ok = sess.get("user", {}).get("phone", "")
    print("   ✅✅✅ چالش کامل شد — کد واقعی تایید شد و نشست ساخته شد")
    print("   کاربر:", uid[:8] + "…", "| شماره:", phone_ok[:6] + "****" + phone_ok[-3:] if len(phone_ok) > 9 else phone_ok)
    print("\n═══ نتیجه: پیامک از sms.ir به گوشی رسید و زنجیرهٔ ورود پیامکی سرتاسر کار می‌کند ═══")
else:
    print("   ❌ تأیید ناموفق:", st, body[:200])
    sys.exit(1)
