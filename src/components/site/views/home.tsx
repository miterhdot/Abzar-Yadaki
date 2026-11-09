"use client";

import { C, FIT, REVIEWS, TRUST, WHY } from "@/data/store";
import { useData, useRoute, useUI } from "@/lib/shop-state";
import { Pn, ProductCard } from "../bits";

export function HomeView() {
  const go = useRoute((s) => s.go);
  const prods = useData((s) => s.prods);
  const banners = useData((s) => s.banners);
  const discounted = prods.filter((p) => p.o);

  return (
    <>
      <section className="hero">
        <div className="w">
          <div>
            <h1>
              قطعه درست، <em>فقط با یک جستجو</em>
              <br />
              برای خودروی شما
            </h1>
            <p>لوازم یدکی اصل و ابزار حرفه‌ای با گارانتی اصالت، قیمت شفاف و ارسال سریع.</p>
            <div className="fit">
              <select aria-label="برند خودرو" defaultValue="">
                <option value="" disabled>برند</option>
                {FIT.brand.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select aria-label="مدل خودرو" defaultValue="">
                <option value="" disabled>مدل</option>
                {FIT.model.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select aria-label="سال ساخت" defaultValue="">
                <option value="" disabled>سال</option>
                {FIT.year.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button className="btn" type="button" onClick={() => go("shop", { cat: "", q: "" })}>
                پیدا کن
              </button>
            </div>
          </div>
          <div className="qt">
            {C.map(([e, n]) => (
              <a key={n} href="#shop" onClick={() => go("shop", { cat: n, q: "" })}>
                <span>{e}</span>
                {n}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="w">
        <div className="trust">
          {TRUST.map(([e, t, d]) => (
            <div key={t}>
              <b>
                {e} {t}
              </b>
              {d}
            </div>
          ))}
        </div>

        <h2>دسته‌بندی‌ها</h2>
        <div className="cats">
          {C.map(([e, n]) => (
            <a key={n} className="cat" href="#shop" onClick={() => go("shop", { cat: n, q: "" })}>
              <span>{e}</span>
              {n}
            </a>
          ))}
        </div>

        <h2>
          پرفروش‌ترین‌ها{" "}
          <a href="#shop" onClick={() => go("shop", { cat: "", q: "" })}>
            مشاهده همه ‹
          </a>
        </h2>
        <div className="grid">
          {prods.slice(0, 5).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>

        <h2>تخفیف‌های ویژه</h2>
        <div className="grid">
          {discounted.slice(0, 5).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>

        <div className="ban">
          {banners.filter((b) => b.active).map((b) => (
            <a key={b.id} href={b.href} style={{ background: b.bg }}>
              <b>{b.t}</b>
              {b.d}
            </a>
          ))}
        </div>

        <h2>
          پیشنهاد ویژه برای شما{" "}
          <a href="#shop" onClick={() => go("shop", { cat: "", q: "" })}>
            همه ›
          </a>
        </h2>
        <div className="grid">
          {prods.slice(8, 13).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>

        <h2>چرا ابزار یدکی؟</h2>
        <div className="rv">
          {WHY.map(([e, t, d]) => (
            <div className="panel" key={t}>
              <span style={{ fontSize: 30 }}>{e}</span>
              <br />
              <b>{t}</b>
              <br />
              <small style={{ color: "var(--mute)" }}>{d}</small>
            </div>
          ))}
        </div>

        <h2>
          نظر مشتریان <small style={{ color: "var(--mute)", fontSize: 12 }}>(متن نمونه؛ با نظر واقعی جایگزین شود)</small>
        </h2>
        <div className="rv">
          {REVIEWS.map(([n, t]) => (
            <Pn key={n} t={"⭐⭐⭐⭐⭐ " + n} d={t} />
          ))}
        </div>

        <div className="panel" style={{ marginTop: 30, textAlign: "center" }}>
          <b>از تخفیف‌ها زودتر خبردار شو</b>
          <form
            className="fm"
            style={{ gridTemplateColumns: "1fr auto", marginTop: 10 }}
            onSubmit={(e) => {
              e.preventDefault();
              useUI.getState().say("عضویت ثبت شد ✓");
              e.currentTarget.reset();
            }}
          >
            <input placeholder="شماره موبایل" required inputMode="numeric" />
            <button className="btn" type="submit">
              عضویت
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
