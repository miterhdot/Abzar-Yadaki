"use client";

import { Fragment, useEffect, useState } from "react";
import { P, Product, FREE } from "@/data/store";
import { F } from "@/lib/format";
import { useRV, useRoute } from "@/lib/shop-state";
import { ProductCard, useAddToCart } from "../bits";
import { Crumb } from "../bits-helper";
import { ShopView } from "./shop";

export function ProductView({ p }: { p: Product }) {
  const go = useRoute((s) => s.go);
  const addToCart = useAddToCart();
  const [qt, setQt] = useState(1);
  const rv = useRV((s) => s.rv);
  const push = useRV((s) => s.push);

  useEffect(() => {
    push(p.id);
  }, [p.id, push]);

  const related = P.filter((x) => x.id !== p.id).slice(0, 5);
  const bundle: Product[] = [p, ...P.filter((x) => x.id !== p.id && x.c !== p.c).slice(0, 2)];
  const sm = bundle.reduce((a, x) => a + x.p, 0);
  const rvIds = rv.filter((x) => x !== p.id);

  return (
    <>
      <Crumb
        parts={[
          <a key="c" href="#shop" onClick={() => go("shop", { cat: p.c, q: "" })}>
            {p.c}
          </a>,
          p.n,
        ]}
      />
      <div className="w">
        <div className="pd">
          <div className="pi">{p.e}</div>
          <div>
            <small>
              {p.c} · {p.b}
            </small>
            <h1 style={{ fontSize: 24, margin: "4px 0" }}>{p.n}</h1>
            <div>
              ⭐ {p.r} · <span className="ok">موجود در انبار</span>
            </div>
            <div className="box">
              <div>{p.o ? <s style={{ color: "var(--mute)" }}>{F(p.o)}</s> : null}</div>
              <b style={{ fontSize: 26 }}>{F(p.p)}</b> تومان
              <div style={{ margin: "12px 0" }}>
                <div className="qty">
                  <button type="button" onClick={() => setQt((x) => Math.max(1, x - 1))}>
                    −
                  </button>
                  <span>{F(qt)}</span>
                  <button type="button" onClick={() => setQt((x) => x + 1)}>
                    +
                  </button>
                </div>
              </div>
              <button className="btn" style={{ width: "100%", padding: 13 }} type="button" onClick={() => addToCart(p.id, qt)}>
                افزودن به سبد خرید
              </button>
            </div>
            <div className="box">
              ✔ ضمانت اصالت کالا
              <br />
              ✔ ارسال تهران همان روز
              <br />
              ✔ ۷ روز مهلت بازگشت
              <br />
              ✔ پشتیبانی فنی انتخاب قطعه
            </div>
          </div>
        </div>
        <div className="box">
          <b>مشخصات فنی</b>
          <ul>
            <li>برند: {p.b}</li>
            <li>دسته: {p.c}</li>
            <li>سازگار با: پژو، پراید، تیبا (طبق انتخاب خودرو)</li>
            <li>گارانتی: اصالت و سلامت فیزیکی</li>
          </ul>
        </div>
        <h2>محصولات مرتبط</h2>
        <div className="grid">
          {related.map((x) => (
            <ProductCard key={x.id} p={x} />
          ))}
        </div>
      </div>

      <div className="w">
        <div className="panel" style={{ marginTop: 20 }}>
          <b>اغلب با هم خریداری می‌شوند</b>
          <div className="bund" style={{ marginTop: 12 }}>
            {bundle.map((x, i) => (
              <Fragment key={x.id}>
                {i ? <b>+</b> : null}
                <a className="pi" href={`#p-${x.id}`}>
                  {x.e}
                </a>
              </Fragment>
            ))}
            <div style={{ marginInlineStart: "auto" }}>
              <small>مجموع {F(bundle.length)} کالا</small>
              <br />
              <b>{F(sm)}</b> تومان
              <br />
              <button
                className="btn"
                type="button"
                onClick={() => {
                  bundle.forEach((x) => addToCart(x.id, 1));
                }}
              >
                افزودن همه
              </button>
            </div>
          </div>
        </div>

        <h2>اطلاعات بیشتر</h2>
        <details open>
          <summary>توضیحات محصول</summary>
          <p>
            {p.n} از برند {p.b}؛ مناسب مصرف روزمره با کیفیت ساخت پایدار. مشخصات دقیق را با انتخاب خودرو تطبیق دهید.
          </p>
        </details>
        <details>
          <summary>نظرات کاربران (نمونه)</summary>
          <p>⭐ {p.r} از ۵ — «کیفیت خوب و ارسال سریع.»</p>
        </details>
        <details>
          <summary>پرسش و پاسخ</summary>
          <p>آیا برای خودروی من مناسب است؟ از انتخاب خودرو در صفحه اول استفاده کنید یا از صفحه تماس بپرسید.</p>
        </details>
        <details>
          <summary>ارسال و بازگشت</summary>
          <p>
            ارسال همان‌روز (سفارش تا ساعت ۱۴)، بازگشت تا ۷ روز با بسته‌بندی سالم. ارسال رایگان بالای {F(FREE)} تومان.
          </p>
        </details>

        {rvIds.length > 0 && (
          <>
            <h2>بازدیدهای اخیر شما</h2>
            <div className="grid">
              {rvIds.map((id) => {
                const x = P.find((y) => y.id === id);
                return x ? <ProductCard key={x.id} p={x} /> : null;
              })}
            </div>
          </>
        )}
      </div>

      <div className="sticky">
        <b>{F(p.p)} تومان</b>
        <button className="btn" type="button" onClick={() => addToCart(p.id, qt)}>
          افزودن به سبد
        </button>
      </div>
    </>
  );
}

export function ProductPage({ id }: { id: number }) {
  const p = P.find((x) => x.id === id);
  if (!p) return <ShopView />;
  return <ProductView key={p.id} p={p} />;
}
