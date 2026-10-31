"use client";

import { useState, type FormEvent } from "react";
import { FREE } from "@/data/store";
import { F, dg } from "@/lib/format";
import { cartTotal, findProduct, useCart, useRoute, useUI } from "@/lib/shop-state";
import { Crumb } from "../bits-helper";
import { ShopView } from "./shop";

export function CheckoutView() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const go = useRoute((s) => s.go);
  const [sh, setSh] = useState(80000);
  const [pm, setPm] = useState("online");

  const t = cartTotal(items);
  if (!items.length)
    return (
      <>
        <Crumb parts={["تسویه حساب"]} />
        <div className="w">
          <h2>سبد خرید خالی است</h2>
          <a className="btn" href="#shop">
            رفتن به فروشگاه
          </a>
        </div>
      </>
    );

  const ship = t >= FREE ? 0 : sh;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const m = (e.currentTarget.elements.namedItem("m") as HTMLInputElement).value.trim();
    if (!/^09\d{9}$/.test(dg(m))) {
      useUI.getState().say("شماره موبایل معتبر نیست");
      return;
    }
    const code = "AY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    useRoute.setState({ lastOrder: code });
    clear();
    go("done", { q: "" });
  };

  return (
    <>
      <Crumb parts={["تسویه حساب"]} />
      <div className="w">
        <h2>تسویه حساب</h2>
        <div className="lay">
          <form className="panel fm" onSubmit={submit}>
            <div className="two">
              <label>
                نام و نام خانوادگی
                <input required />
              </label>
              <label>
                موبایل
                <input name="m" inputMode="numeric" required />
              </label>
            </div>
            <label>
              نشانی کامل
              <textarea rows={3} required />
            </label>
            <b>روش ارسال</b>
            <label className="opt">
              <input type="radio" name="sh" checked={sh === 80000} onChange={() => setSh(80000)} />
              پست پیشتاز · {F(80000)} تومان
            </label>
            <label className="opt">
              <input type="radio" name="sh" checked={sh === 120000} onChange={() => setSh(120000)} />
              پیک (همان‌روز) · {F(120000)} تومان
            </label>
            <b>روش پرداخت</b>
            <label className="opt">
              <input type="radio" name="pm" checked={pm === "online"} onChange={() => setPm("online")} />
              درگاه آنلاین امن
            </label>
            <label className="opt">
              <input type="radio" name="pm" checked={pm === "cod"} onChange={() => setPm("cod")} />
              پرداخت در محل
            </label>
            <button className="btn" style={{ padding: 13 }} type="submit">
              ثبت سفارش
            </button>
          </form>
          <div className="panel">
            <b>خلاصه سفارش</b>
            {items.map((x) => {
              const p = findProduct(x.id);
              if (!p) return null;
              return (
                <div className="sum" key={x.id}>
                  <span>
                    {p.e} {p.n} × {F(x.n)}
                  </span>
                  <span>{F(p.p * x.n)}</span>
                </div>
              );
            })}
            <hr style={{ borderColor: "var(--line)" }} />
            <div id="ckt">
              <div className="sum">
                <span>جمع کالاها</span>
                <span>{F(t)}</span>
              </div>
              <div className="sum">
                <span>ارسال</span>
                <span>{ship ? F(ship) : "رایگان"}</span>
              </div>
              <div className="sum">
                <b>مبلغ قابل پرداخت</b>
                <b>{F(t + ship)} تومان</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function DoneView() {
  const last = useRoute((s) => s.lastOrder);
  return (
    <div className="w" style={{ textAlign: "center", padding: "50px 0" }}>
      <div style={{ fontSize: 60 }}>✅</div>
      <h2 style={{ justifyContent: "center" }}>سفارش شما ثبت شد</h2>
      <p>
        کد پیگیری: <b>{last}</b>
      </p>
      <a className="btn" href="#home">
        بازگشت به صفحه اول
      </a>
    </div>
  );
}
