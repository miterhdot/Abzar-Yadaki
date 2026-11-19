#!/usr/bin/env python3
# دستور ۴۴ — اعمال مایگریشن ۰۰۰۷ (جدول sms_config + حذف ستون‌های عمومی پیامک از settings)
import json
import re
import sys
import urllib.error
import urllib.request

REF = "wdbixiercvkshmamobro"
SAT = open("/home/z/my-project/secrets/supabase_access_token.txt").read().strip()
SQL = open("/home/z/my-project/Abzar-Yadaki/supabase/migrations/0007_sms_privacy.sql").read()


def call(url, method="GET", body=None):
    h = {"Authorization": f"Bearer {SAT}", "Content-Type": "application/json", "Accept": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=90) as res:
            return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)


print("اعمال مایگریشن ۰۰۰۷ ...")
st, body = call(f"https://api.supabase.com/v1/projects/{REF}/database/query", "POST", {"query": SQL})
print("status:", st, body[:400])

# تأیید ساختار
st, body = call(f"https://api.supabase.com/v1/projects/{REF}/database/query", "POST", {
    "query": "select column_name from information_schema.columns where table_schema='public' and table_name='settings' and column_name like 'sms_%'"
})
print("ستون‌های sms_* باقی‌مانده در settings:", body[:200])

st, body = call(f"https://api.supabase.com/v1/projects/{REF}/database/query", "POST", {
    "query": "select id, admin_mobile, notify_new_order, notify_status from public.sms_config"
})
print("sms_config:", body[:200])
