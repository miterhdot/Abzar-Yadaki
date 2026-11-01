#!/usr/bin/env python3
# W5 — ساخت برگه تماس (contact sheet) از اسکرین‌شات‌ها برای بازبینی بصری
from PIL import Image, ImageDraw, ImageFont
import os

BASE = '/home/z/my-project/download/w5-review'

def build(mode, groups, cell_w, cell_h, cols, out_prefix):
    d = os.path.join(BASE, mode)
    font = None
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
    except Exception:
        font = ImageFont.load_default()
    for gi, names in enumerate(groups, 1):
        rows = (len(names) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * cell_w + (cols + 1) * 8, rows * (cell_h + 26) + 8), '#dddddd')
        dr = ImageDraw.Draw(sheet)
        for i, name in enumerate(names):
            p = os.path.join(d, name)
            if not os.path.exists(p):
                continue
            im = Image.open(p).convert('RGB')
            # مقیاس حفظ نسبت در سلول
            s = min(cell_w / im.width, cell_h / im.height)
            tw, th = max(1, int(im.width * s)), max(1, int(im.height * s))
            im = im.resize((tw, th), Image.LANCZOS)
            cx, cy = i % cols, i // cols
            x = 8 + cx * (cell_w + 8)
            y = 8 + cy * (cell_h + 26)
            sheet.paste(im, (x + (cell_w - tw) // 2, y))
            dr.text((x + 2, y + cell_h + 2), name.replace('.png', ''), fill='#111111', font=font)
        out = os.path.join(BASE, f'{out_prefix}{gi}.jpg')
        sheet.save(out, quality=72)
        print(out, sheet.size, os.path.getsize(out) // 1024, 'KB')

# دسکتاپ: ۴ برگه
build('desktop', [
    ['01-home.png','02-shop.png','03-product.png','04-cats.png','05-offers.png','06-about.png','07-contact.png','08-auth.png'],
    ['09-account.png','10-wishlist-empty.png','11-faq.png','12-terms.png','13-returns.png','14-notfound.png','15-wishlist-item.png','16-cart-drawer.png'],
    ['17-checkout.png','18-done.png','19-track-form.png','20-track-result.png','21-auth-step2.png','22-account-logged-in.png','23-admin-gate.png','24-admin-dashboard.png'],
    ['25-adm-products.png','26-adm-orders.png','27-adm-customers.png','28-adm-reviews.png','29-adm-coupons.png','30-adm-banners.png','31-adm-messages.png','32-adm-reports.png','33-adm-settings.png','34-adm-order-details.png'],
], 420, 700, 4, 'sheet-desktop-')

# موبایل: ۴ برگه
build('mobile', [
    ['01-home.png','02-shop.png','03-product.png','04-cats.png','05-offers.png','06-about.png','07-contact.png','08-auth.png','09-account.png'],
    ['10-track.png','11-wishlist.png','12-faq.png','13-terms.png','14-returns.png','15-notfound.png','16-done.png','17-cart-drawer.png','18-checkout.png'],
    ['19-admin-dashboard.png','20-adm-products.png','21-adm-orders.png','22-adm-customers.png','23-adm-reviews.png','24-adm-coupons.png','25-adm-banners.png','26-adm-messages.png','27-adm-reports.png','28-adm-settings.png'],
], 300, 820, 5, 'sheet-mobile-')

print('DONE')
