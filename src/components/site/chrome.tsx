"use client";

import { C } from "@/data/store";
import { F } from "@/lib/format";
import { useCart, useRoute, useUI } from "@/lib/shop-state";
import { LogoMark } from "./bits";

export function Header() {
  const go = useRoute((s) => s.go);
  const items = useCart((s) => s.items);
  const dr = useUI((s) => s.dr);
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
        <button className="cartb" type="button" onClick={() => dr(true)}>
          🛒 سبد<b>{F(count)}</b>
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
  return <div className="ann">ارسال رایگان برای خرید بالای ۳ میلیون تومان · ضمانت اصالت کالا</div>;
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
          گارانتی اصالت · ۷ روز بازگشت · پشتیبانی واتساپ
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
          <a href="#about">درباره ما</a> · <a href="#contact">تماس</a> · <a href="#offers">تخفیف‌ها</a> ·{" "}
          <a href="#admin">پنل مدیریت</a>
        </div>
      </div>
    </footer>
  );
}
