"use client";

import { useState, type FormEvent } from "react";
import { STATUS_FA, type OrderLine } from "@/data/store";
import { F, dg } from "@/lib/format";
import { cartTotal, findProduct, useAuth, useCart, useData, useRoute, useUI } from "@/lib/shop-state";
import { dbCreateOrder, dbTrackOrder } from "@/lib/supabase";
import { Crumb } from "../bits-helper";

export function CheckoutView() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const go = useRoute((s) => s.go);
  const user = useAuth((s) => s.user);
  const settings = useData((s) => s.settings);
  const addresses = useData((s) => s.addresses);
  const coupons = useData((s) => s.coupons);

  const [ship, setShip] = useState<"post" | "peyk">("post");
  const [pm, setPm] = useState("online");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; percent: number; max: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const t = cartTotal(items);
  const myAddr = user ? addresses.filter((a) => dg(a.phone) === dg(user.phone)) : [];

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

  const shipCost = t >= settings.free ? 0 : ship === "peyk" ? settings.shipPeyk : settings.shipPost;
  const off = applied ? Math.min(Math.round((t * applied.percent) / 100), applied.max) : 0;
  const payable = Math.max(0, t - off) + shipCost;

  const applyCoupon = () => {
    const c = coupons.find((x) => x.code === coupon.trim().toUpperCase());
    if (!c || !c.active) {
      useUI.getState().say("کد تخفیف معتبر نیست");
      setApplied(null);
      return;
    }
    const discount = Math.min(Math.round((t * c.percent) / 100), c.max);
    setApplied({ code: c.code, percent: c.percent, max: c.max });
    useUI.getState().say(`کد ${c.code} اعمال شد — تخفیف ${F(discount)} تومان ✓`);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget.elements;
    const name = (el.namedItem("n") as HTMLInputElement).value.trim();
    const m = dg((el.namedItem("m") as HTMLInputElement).value.trim());
    const addr = (el.namedItem("a") as HTMLTextAreaElement).value.trim();
    if (!/^09\d{9}$/.test(m)) {
      useUI.getState().say("شماره موبایل معتبر نیست");
      return;
    }
    setBusy(true);
    /* ثبت واقعی — قیمت‌گذاری فقط سمت سرور (تابع امن create_order، ضد دستکاری) */
    const res = await dbCreateOrder({
      name,
      phone: m,
      items: items.map((x) => ({ id: x.id, qty: x.n })),
      pay: pm === "cod" ? "cod" : "online",
      ship,
      addr,
      coupon: applied?.code,
    });
    if (res.ok) {
      const tr = await dbTrackOrder(res.code, m);
      useUI.getState().say(
        tr.ok
          ? `سفارش ثبت شد ✓ — مبلغ واقعی: ${F(tr.order.total)} تومان`
          : "سفارش ثبت شد ✓"
      );
      useRoute.setState({ lastOrder: res.code });
      clear();
      setApplied(null);
      setBusy(false);
      go("done", { q: "" });
      return;
    }
    setBusy(false);
    if (res.error === "db-off") {
      /* دیتابیس در دسترس نیست — ثبت نمایشی مصوب (مصوبه ۱۰) با اعلام صریح */
      const code = "AY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const lines: OrderLine[] = items.map((x) => [x.id, x.n]);
      useData.getState().addOrder({
        code,
        name,
        phone: m,
        items: items.reduce((a, x) => a + x.n, 0),
        total: payable,
        status: "processing",
        day: 0,
        lines,
        addr,
        pay: pm,
        ship,
      });
      useUI.getState().say("اتصال دیتابیس برقرار نیست — سفارش به‌صورت نمایشی ثبت شد");
      useRoute.setState({ lastOrder: code });
      clear();
      setApplied(null);
      go("done", { q: "" });
      return;
    }
    useUI.getState().say(res.error);
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
                <input name="n" required defaultValue={user?.name ?? ""} />
              </label>
              <label>
                موبایل
                <input name="m" inputMode="numeric" required defaultValue={user ? dg(user.phone) : ""} />
              </label>
            </div>
            {myAddr.length > 0 && (
              <>
                <b>آدرس‌های ذخیره‌شده</b>
                {myAddr.map((a) => (
                  <label className="opt" key={a.id}>
                    <input
                      type="radio"
                      name="saved"
                      onChange={() => {
                        const ta = document.querySelector<HTMLTextAreaElement>('textarea[name="a"]');
                        if (ta) ta.value = a.text;
                      }}
                    />
                    📍 {a.title} — {a.text.slice(0, 42)}…
                  </label>
                ))}
              </>
            )}
            <label>
              نشانی کامل
              <textarea name="a" rows={3} required />
            </label>
            <b>روش ارسال</b>
            <label className="opt">
              <input type="radio" name="sh" checked={ship === "post"} onChange={() => setShip("post")} />
              پست پیشتاز · {F(settings.shipPost)} تومان
            </label>
            <label className="opt">
              <input type="radio" name="sh" checked={ship === "peyk"} onChange={() => setShip("peyk")} />
              پیک (همان‌روز) · {F(settings.shipPeyk)} تومان
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
            <button className="btn" style={{ padding: 13 }} type="submit" disabled={busy}>
              {busy ? "در حال ثبت…" : "ثبت سفارش"}
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
            <label style={{ fontSize: 13, color: "var(--mute)", display: "grid", gap: 4, margin: "6px 0" }}>
              کد تخفیف
              <span style={{ display: "flex", gap: 6 }}>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="مثلاً WELCOME"
                  style={{
                    flex: 1,
                    padding: 9,
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    font: "inherit",
                    background: "var(--card)",
                    color: "var(--ink)",
                    direction: "ltr",
                  }}
                />
                <button className="btn ghost" type="button" onClick={applyCoupon} style={{ padding: "8px 14px" }}>
                  اعمال
                </button>
              </span>
            </label>
            <div id="ckt">
              <div className="sum">
                <span>جمع کالاها</span>
                <span>{F(t)}</span>
              </div>
              {applied && (
                <div className="sum" style={{ color: "var(--ok)" }}>
                  <span>تخفیف ({applied.code})</span>
                  <span>−{F(off)}</span>
                </div>
              )}
              <div className="sum">
                <span>ارسال</span>
                <span>{shipCost ? F(shipCost) : "رایگان"}</span>
              </div>
              <div className="sum">
                <b>مبلغ قابل پرداخت</b>
                <b>{F(payable)} تومان</b>
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
  const status = useData((s) => s.orders.find((o) => o.code === last)?.status ?? "processing");
  return (
    <div className="w" style={{ textAlign: "center", padding: "50px 0" }}>
      <div style={{ fontSize: 60 }}>✅</div>
      <h2 style={{ justifyContent: "center" }}>سفارش شما ثبت شد</h2>
      <p>
        کد پیگیری: <b>{last}</b> · وضعیت فعلی: <span className="badge b-off">{STATUS_FA[status]}</span>
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a className="btn" href="#track" onClick={() => useRoute.getState().go("track", { q: last })}>
          📦 پیگیری سفارش
        </a>
        <a className="btn ghost" href="#home">
          بازگشت به صفحه اول
        </a>
      </div>
    </div>
  );
}
