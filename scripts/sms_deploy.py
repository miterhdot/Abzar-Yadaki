#!/usr/bin/env python3
# دستور ۴۳ — دیپلوی Edge Function «send-sms» روی پروژهٔ ساپابیس با Management API
# کلید/توکن‌ها فقط از secrets/ خوانده می‌شوند و مقادیر محرمانه هرگز چاپ نمی‌شوند.
import json
import sys
import urllib.error
import urllib.request
import uuid

REF = "wdbixiercvkshmamobro"
SRC = "supabase/functions/send-sms/index.ts"
tok = open("/home/z/my-project/Abzar-Yadaki/secrets/supabase_access_token.txt").read().strip()

src = open(SRC, "rb").read()
boundary = "----abzar" + uuid.uuid4().hex

# بخش‌های multipart: metadata (JSON) + file (سورس تابع)
metadata = json.dumps({"name": "send-sms", "entrypoint_path": "index.ts", "verify_jwt": False})


def part_field(name, value: str, ctype: str) -> bytes:
    return (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{name}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode() + value.encode() + b"\r\n"


def part_file(name, filename: str, data: bytes) -> bytes:
    return (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode() + data + b"\r\n"


body = (
    part_field("metadata", metadata, "application/json")
    + part_file("file", "index.ts", src)
    + f"--{boundary}--\r\n".encode()
)

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{REF}/functions/deploy?slug=send-sms",
    data=body,
    method="POST",
    headers={
        "Authorization": f"Bearer {tok}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
)
try:
    with urllib.request.urlopen(req, timeout=180) as r:
        out = r.read().decode()
        print("DEPLOY HTTP", r.status)
        print(out[:400])
except urllib.error.HTTPError as e:
    print("DEPLOY HTTP", e.code)
    print(e.read().decode()[:800])
    sys.exit(1)

# راستی‌آزمایی: فهرست توابع
req2 = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{REF}/functions",
    headers={"Authorization": f"Bearer {tok}"},
)
with urllib.request.urlopen(req2, timeout=60) as r:
    fns = json.loads(r.read().decode())
    for f in fns:
        print("FUNC:", f.get("slug"), "| verify_jwt =", f.get("verify_jwt"), "| status =", f.get("status"))

# راستی‌آزمایی: فراخوانی بدون احراز هویت باید 401 بدهد (دروازهٔ ادمین بسته است)
req3 = urllib.request.Request(f"https://{REF}.supabase.co/functions/v1/send-sms", data=b"{}", method="POST", headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req3, timeout=60) as r:
        print("NOAUTH HTTP", r.status, r.read().decode()[:200])
except urllib.error.HTTPError as e:
    print("NOAUTH HTTP", e.code, e.read().decode()[:200])
