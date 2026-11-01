"use client";

import { Pn } from "../bits";
import { Crumb } from "../bits-helper";

export function AboutView() {
  return (
    <>
      <Crumb parts={["درباره ما"]} />
      <div className="w">
        <h2>درباره ابزار یدکی</h2>
        <div className="lay">
          <div className="panel">
            <p>
              ابزار یدکی با هدف ساده‌کردن خرید قطعه‌ی درست برای خودرو شروع شد: قطعه‌ی اصل، قیمت شفاف و راهنمایی فنی پیش
              از خرید.
            </p>
            <p>ما فقط کالایی می‌فروشیم که اصالت آن را می‌توانیم تضمین کنیم، و اگر قطعه سازگار نبود، بدون دردسر برمی‌گردد.</p>
          </div>
          <div className="rv" style={{ gridTemplateColumns: "1fr" }}>
            <Pn t="🛡️ اصالت" d="کد رهگیری و فاکتور رسمی" />
            <Pn t="🎯 دقت" d="تطبیق قطعه با خودرو" />
            <Pn t="🤝 پشتیبانی" d="پاسخ‌گویی در ساعات کاری" />
          </div>
        </div>
      </div>
    </>
  );
}
