"use client";

import { C } from "@/data/store";
import { F } from "@/lib/format";
import { useAuth, useCart, useData, useRoute, useUI, useWish } from "@/lib/shop-state";
import { LogoMark } from "./bits";

export function Header() {
  const go = useRoute((s) => s.go);
  const items = useCart((s) => s.items);
  const removed = useCart((s) => s.removed);
  const dr = useUI((s) => s.dr);
  const rdr = useUI((s) => s.rdr);
  const user = useAuth((s) => s.user);
  const wishCount = useWish((s) => s.ids.length);
  const count = items.reduce((a, x) => a + x.n, 0);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    go("shop", { q });
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
        {/* آیکن «لیست کالای حذف‌شده» کنار سبد — قرمز و هایلایت‌دار (دستور ۲۷) */}
        <button className="cartb rmb" type="button" onClick={() => rdr(true)} title="لیست کالای حذف‌شده">
          🗑 حذف‌شده‌ها{removed.length > 0 && <b>{F(removed.length)}</b>}
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
          <b>ابزار یدکی</b>
          <br />
          قطعه اصل، قیمت شفاف، ارسال سریع.
        </div>
        <div>
          <b>خدمات</b>
          <br />
          گارانتی اصالت · ۷ روز بازگشت · پشتیبانی فنی
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
      </div>
    </footer>
  );
}
