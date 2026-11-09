"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Product } from "@/data/store";
import { F } from "@/lib/format";
import { useAuth, useData, useRV, useRoute, useUI } from "@/lib/shop-state";
import { FavBtn, Pn, ProductCard, useAddToCart, useWaiting } from "../bits";
import { Crumb } from "../bits-helper";
import { ShopView } from "./shop";

export function ProductView({ p }: { p: Product }) {
  const go = useRoute((s) => s.go);
  const addToCart = useAddToCart();
  const wt = useWaiting();
  const inWait = wt.savedIds.includes(p.id); /* وضعیت لیست انتظار (دستور ۲۸) */
  const [qt, setQt] = useState(1);
  const rv = useRV((s) => s.rv);
  const push = useRV((s) => s.push);
  const prods = useData((s) => s.prods);
  const free = useData((s) => s.settings.free);
  const reviews = useData((s) => s.reviews);
  const okReviews = reviews.filter((r) => r.status === "ok" && r.pid === p.id);

  useEffect(() => {
    push(p.id);
  }, [p.id, push]);

  const related = prods.filter((x) => x.id !== p.id).slice(0, 5);
  const bundle: Product[] = [p, ...prods.filter((x) => x.id !== p.id && x.c !== p.c).slice(0, 2)];
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
          <div className="pi">
            <FavBtn id={p.id} />
            {p.e}
          </div>
          <div>
            <small>
              {p.c} · {p.b}
            </small>
            <h1 style={{ fontSize: 24, margin: "4px 0" }}>{p.n}</h1>
            <div>
              ⭐ {p.r} · <span className="ok">{p.s ? "موجود · ارسال امروز" : "موجود در انبار"}</span>
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
              {/* ذخیره در لیست انتظار — کالایی که روی آن شک دارید (دستور ۲۸) */}
              <button
                className={"btn ghost" + (inWait ? " on" : "")}
                style={{ width: "100%", padding: 11, marginTop: 8 }}
                type="button"
                aria-pressed={inWait}
                onClick={() => wt.toggle(p.id)}
              >
                {inWait ? "✓ در لیست انتظار است" : "⏳ ذخیره در لیست انتظار"}
              </button>
              <small style={{ color: "var(--mute)", display: "block", marginTop: 6 }}>
                کالاهایی که هنوز درباره‌شان مطمئن نیستید، در «لیست انتظار» نگه داشته می‌شوند.
              </small>
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

        <h2>نظرات خریداران ({F(okReviews.length)})</h2>
        {okReviews.length === 0 && (
          <p style={{ color: "var(--mute)" }}>هنوز نظری برای این محصول تایید نشده؛ اولین نفر باشید.</p>
        )}
        <div className="rv" style={{ marginTop: 10 }}>
          {okReviews.map((r) => (
            <Pn key={r.id} t={`⭐ ${r.r} از ۵ — ${r.name}`} d={r.text} />
          ))}
        </div>
        <ReviewForm pid={p.id} />

        <h2>اطلاعات بیشتر</h2>
        <details open>
          <summary>توضیحات محصول</summary>
          <p>
            {p.n} از برند {p.b}؛ مناسب مصرف روزمره با کیفیت ساخت پایدار. مشخصات دقیق را با انتخاب خودرو تطبیق دهید.
          </p>
        </details>
        <details>
          <summary>پرسش و پاسخ</summary>
          <p>آیا برای خودروی من مناسب است؟ از انتخاب خودرو در صفحه اول استفاده کنید یا از صفحه تماس بپرسید.</p>
        </details>
        <details>
          <summary>ارسال و بازگشت</summary>
          <p>
            ارسال همان‌روز (سفارش تا ساعت ۱۴)، بازگشت تا ۷ روز با بسته‌بندی سالم. ارسال رایگان بالای {F(free)} تومان.
          </p>
        </details>

        {rvIds.length > 0 && (
          <>
            <h2>بازدیدهای اخیر شما</h2>
            <div className="grid">
              {rvIds.map((id) => {
                const x = prods.find((y) => y.id === id);
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
  const prods = useData((s) => s.prods);
  const p = prods.find((x) => x.id === id);
  if (!p) return <ShopView />;
  return <ProductView key={p.id} p={p} />;
}

/** فرم ثبت نظر — پس از تایید ادمین نمایش داده می‌شود */
function ReviewForm({ pid }: { pid: number }) {
  const user = useAuth((s) => s.user);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget.elements;
    const name = (el.namedItem("rn") as HTMLInputElement).value.trim();
    const r = (el.namedItem("rr") as HTMLSelectElement).value;
    const text = (el.namedItem("rx") as HTMLTextAreaElement).value.trim();
    useData.getState().addReview({ id: Date.now(), pid, name, text, r, status: "pending" });
    useUI.getState().say("نظر شما ثبت شد و پس از تایید نمایش داده می‌شود ✓");
    e.currentTarget.reset();
  };

  return (
    <form className="panel fm" style={{ marginTop: 14, maxWidth: 620 }} onSubmit={submit}>
      <b>ثبت نظر شما</b>
      <div className="two">
        <label>
          نام
          <input name="rn" defaultValue={user?.name ?? ""} required />
        </label>
        <label>
          امتیاز
          <select name="rr" defaultValue="۵">
            <option>۵</option>
            <option>۴</option>
            <option>۳</option>
            <option>۲</option>
            <option>۱</option>
          </select>
        </label>
      </div>
      <label>
          نظر شما
        <textarea name="rx" rows={3} required />
      </label>
      <button className="btn" type="submit">
        ارسال نظر
      </button>
    </form>
  );
}
