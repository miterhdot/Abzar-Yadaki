#!/usr/bin/env python3
# دستور ۴۴ — چرخش رمز هوک: رمز جدید تولید، در Secret تابع و پیکربندی Auth ثبت، ذخیرهٔ محلی.
# مقدار رمز هرگز چاپ نمی‌شود.
import base64
import json
import os
import re
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
SAT = open("/home/z/my-project/secrets/supabase_access_token.txt").read().strip()
SECRET = "v1,whsec_" + base64.b64encode(os.urandom(32)).decode()
open("/home/z/my-project/secrets/sms_hook_secret.txt", "w").write(SECRET)
os.chmod("/home/z/my-project/secrets/sms_hook_secret.txt", 0o600)
print("رمز جدید تولید شد و در secrets/sms_hook_secret.txt ذخیره شد")


def call(url, method="GET", body=None):
    h = {"Authorization": f"Bearer {SAT}", "Content-Type": "application/json", "Accept": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=60) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)


print("۱) ثبت در Secretهای تابع (POST /projects/{ref}/secrets) ...")
st, body = call(f"https://api.supabase.com/v1/projects/{REF}/secrets",
                "POST", [{"name": "SMS_HOOK_SECRET", "value": SECRET}])
print("   ", st, body[:200] if st != 201 else "ok")

print("۲) به‌روزرسانی hook_send_sms_secrets در پیکربندی Auth (رشتهٔ کاما) ...")
st, body = call(f"https://api.supabase.com/v1/projects/{REF}/config/auth",
                "PATCH", {"hook_send_sms_secrets": SECRET})
print("   ", st, body[:200] if st != 200 else "ok")

print("۳) تأیید — طول فیلد پیکربندی:")
st, body = call(f"https://api.supabase.com/v1/projects/{REF}/config/auth")
cfg = json.loads(body)
secrets_cfg = cfg.get("hook_send_sms_secrets")
print("   hook_send_sms_secrets entries:", len(secrets_cfg) if isinstance(secrets_cfg, list) else "?",
      "| matches new:", bool(secrets_cfg and secrets_cfg[0] == SECRET))
print("   hook_send_sms_enabled:", cfg.get("hook_send_sms_enabled"),
      "| uri set:", bool(cfg.get("hook_send_sms_uri")))
