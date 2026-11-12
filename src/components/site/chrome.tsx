"use client";

import { C } from "@/data/store";
import { F } from "@/lib/format";
import { useAuth, useCart, useData, useRoute, useUI, useWish } from "@/lib/shop-state";
import { LogoMark } from "./bits";

export function Header() {
  const go = useRoute((s) => s.go);
  const items = useCart((s) => s.items);
  const waitTotal = useCart((s) => s.removed.length + s.saved.length); /* شمارندهٔ کل لیست انتظار (دستور ۲۸) */
  const dr = useUI((s) => s.dr);
  const rdr = useUI((s) => s.rdr);
  const user = useAuth((s) => s.user);
  const wishCount = useWish((s) => s.ids.length);
  const count = items.reduce((a, x) => a + x.n, 0);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    /* دستور ۲۹: جستجو جستجوی کل فروشگاه است — از دستهٔ فعلی خارج می‌شود تا نتیجه به یک دسته محدود نشود */
    go("shop", { q, cat: "" });
  };

  return (
    <header>
      <div className="hd">
        <a href="#home" className="logo">
          <LogoMark />
          <span>
            <span className="lg">
              <b>ابزار</b>
              <i>یدکی</i>
            </span>
            <small>Abzaryadaki.com</small>
          </span>
        </a>
        <form className="search" onSubmit={onSearch}>
          <input name="q" placeholder="نام قطعه، کد فنی یا خودرو..." />
          <button type="submit">جستجو</button>
        </form>
        <a className="cartb" href={user ? "#account" : "#auth"} title={user ? "حساب کاربری" : "ورود / ثبت‌نام"}>
          👤 {user ? user.name.split(" ")[0] : "ورود"}
        </a>
        <button className="cartb" type="button" onClick={() => dr(true)}>
          🛒 سبد<b>{F(count)}</b>
        </button>
        {/* آیکن قرمز «لیست انتظار» کنار سبد — دو دسته: حذف‌شده از سبد + در حال بررسی (دستور ۲۸) */}
        <button className="cartb rmb" type="button" onClick={() => rdr(true)} title="لیست انتظار">
          ⏳ لیست انتظار{waitTotal > 0 && <b>{F(waitTotal)}</b>}
        </button>
      </div>
      <nav>
        <div className="w">
          <a href="#shop" onClick={() => go("shop", { cat: "", q: "" })}>
            همه محصولات
          </a>
          <a href="#cats">دسته‌بندی‌ها</a>
          {C.slice(0, 5).map(([e, n]) => (
            <a key={n} href="#shop" onClick={() => go("shop", { cat: n, q: "" })}>
              {n}
            </a>
          ))}
          <a href="#offers" style={{ color: "#ffb27a" }}>
            🔥 تخفیف‌ها
          </a>
          {wishCount > 0 && (
            <a href="#wishlist">
              ❤️ علاقه‌مندی‌ها ({F(wishCount)})
            </a>
          )}
          <a href="#track">پیگیری سفارش</a>
          <a href="#about">درباره ما</a>
          <a href="#contact">تماس با ما</a>
        </div>
      </nav>
      <div className="chips">
        {C.map(([e, n]) => (
          <a key={n} href="#shop" onClick={() => go("shop", { cat: n, q: "" })}>
            {e} {n}
          </a>
        ))}
      </div>
    </header>
  );
}

export function AnnBar() {
  const ann = useData((s) => s.settings.ann);
  return <div className="ann">{ann}</div>;
}

export function Footer() {
  return (
    <footer>
      <div className="w">
        <div>
          <b>خدمات</b>
          <br />
          گارانتی اصالت · پشتیبانی فنی
        </div>
        <div>
          <b>حساب کاربری</b>
          <br />
          <a href="#account">حساب من</a> · <a href="#track">پیگیری سفارش</a> · <a href="#wishlist">علاقه‌مندی‌ها</a>
        </div>
        <div>
          <b>پرداخت</b>
          <br />
          درگاه امن بانکی · پرداخت در محل
        </div>
        <div>
          <b>تماس</b>
          <br />
          ساعت کاری ۹ تا ۲۱
          <br />
          info@abzaryadaki.com
        </div>
        <div>
          <b>دسترسی سریع</b>
          <br />
          <a href="#about">درباره ما</a> · <a href="#contact">تماس</a> · <a href="#offers">تخفیف‌ها</a>
          <br />
          <a href="#faq">سوالات متداول</a> · <a href="#terms">قوانین</a> · <a href="#returns">رویه بازگشت</a> ·{" "}
          <a href="#admin">پنل مدیریت</a>
          <br />
          <a href="#privacy">حریم خصوصی</a> · <a href="#cookies">سیاست کوکی</a> · <a href="#refund">شرایط بازگشت پول</a>
        </div>
        {/* دستور ۳۸: بلوک «درباره ابزاریدکی» (۳۵/۳۶) به زیر تمام لینک‌های فوتر منتقل شد + ارجاع «۷ روز بازگشت» طبق دستور مدیر حذف شد */}
        <div className="fab">
          <b>درباره ابزاریدکی</b>
          <p>
            <strong>ابزاریدکی</strong> (abzaryadaki.com) فروشگاه اینترنتی ابزار و لوازم یدکی خودرو است؛ مرجع{" "}
            <a href="#shop">خرید اینترنتی قطعات یدکی خودرو</a>، <a href="#cats">ابزار دستی و ابزار برقی</a> با
            تضمین اصالت کالا، قیمت شفاف و ارسال سریع به سراسر ایران. در ابزاریدکی قطعات مصرفی مانند فیلتر روغن،
            لنت ترمز و شمع را مطابق خودروی خود جست‌وجو کنید و با پشتیبانی فنی خیال‌راحت سفارش دهید.
          </p>
          {/* توضیحات انگلیسی برای ایندکس سئوی گوگل — LTR و کم‌رنگ‌تر */}
          <p className="en" dir="ltr" lang="en">
            <strong>Abzar Yadaki</strong> (abzaryadaki.com) is an Iranian{" "}
            <a href="#shop">online auto parts and tools store</a>: buy genuine car spare parts,{" "}
            <a href="#cats">hand tools and power tools</a> with authenticity guarantee, transparent pricing and
            fast nationwide delivery across Iran — backed by technical support.
          </p>
        </div>
      </div>
    </footer>
  );
}
