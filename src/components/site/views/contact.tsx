"use client";

import { FREE } from "@/data/store";
import { F, dg } from "@/lib/format";
import { useData, useUI } from "@/lib/shop-state";
import { Pn } from "../bits";
import { Crumb } from "../bits-helper";

export function ContactView() {
  return (
    <>
      <Crumb parts={["تماس با ما"]} />
      <div className="w">
        <h2>تماس با ما</h2>
        <div className="lay">
          <form
            className="panel fm"
            onSubmit={(e) => {
              e.preventDefault();
              const el = e.currentTarget.elements;
              const m = dg((el.namedItem("m") as HTMLInputElement).value.trim());
              if (!/^09\d{9}$/.test(m)) {
                useUI.getState().say("شماره موبایل معتبر نیست");
                return;
              }
              useData.getState().addMsg({
                id: Date.now(),
                name: (el.namedItem("n") as HTMLInputElement).value.trim(),
                phone: m,
                subject: (el.namedItem("s") as HTMLSelectElement).value,
                text: (el.namedItem("t") as HTMLTextAreaElement).value.trim(),
                unread: true,
                day: 0,
              });
              useUI.getState().say("پیام شما ثبت شد و در اسرع وقت پاسخ داده می‌شود ✓");
              e.currentTarget.reset();
            }}
          >
            <div className="two">
              <label>
                نام
                <input name="n" required />
              </label>
              <label>
                موبایل
                <input name="m" inputMode="numeric" placeholder="۰۹۱۲..." required />
              </label>
            </div>
            <label>
              موضوع
              <select name="s">
                <option>انتخاب قطعه مناسب خودرو</option>
                <option>پیگیری سفارش</option>
                <option>مرجوعی و گارانتی</option>
                <option>همکاری عمده</option>
              </select>
            </label>
            <label>
              پیام
              <textarea name="t" rows={5} required />
            </label>
            <button className="btn" type="submit">
              ارسال پیام
            </button>
          </form>
          <div className="rv" style={{ gridTemplateColumns: "1fr" }}>
            <Pn t="📞 تلفن" d="۰۲۱-۰۰۰۰۰۰۰۰ (نمونه)" />
            <Pn t="✉️ ایمیل" d="info@abzaryadaki.com" />
            <Pn t="🕘 ساعت کاری" d="شنبه تا پنجشنبه، ۹ تا ۲۱" />
            <Pn t="📍 نشانی" d="نشانی فروشگاه را اینجا بنویسید" />
          </div>
        </div>
        <h2>
          پرسش‌های متداول{" "}
          <a href="#faq">همه سوالات ‹</a>
        </h2>
        <details>
          <summary>چطور قطعه‌ی سازگار را پیدا کنم؟</summary>
          <p>از انتخاب برند، مدل و سال در صفحه اول استفاده کنید.</p>
        </details>
        <details>
          <summary>مهلت بازگشت کالا چقدر است؟</summary>
          <p>۷ روز، با بسته‌بندی سالم.</p>
        </details>
        <details>
          <summary>ارسال رایگان دارید؟</summary>
          <p>بله، برای سفارش‌های بالای {F(FREE)} تومان.</p>
        </details>
      </div>
    </>
  );
}
