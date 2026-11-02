"use client";

import { useState, type FormEvent } from "react";
import { STATUS_FA, OrderStatus } from "@/data/store";
import { F, dg, fa } from "@/lib/format";
import { findProduct, useData, useRoute, useUI } from "@/lib/shop-state";
import { dbReady, dbTrackOrder, type TrackedOrder } from "@/lib/supabase";
import { Crumb } from "../bits-helper";

const STEPS: [string, string][] = [
  ["✓", "ثبت سفارش"],
  ["⏳", "در حال پردازش"],
  ["🚚", "ارسال شده"],
  ["🏠", "تحویل شده"],
];

const stepOf = (s: OrderStatus): number =>
  s === "processing" ? 1 : s === "sent" ? 2 : s === "done" ? 3 : -1;

const dayFa = (d: number) => (d === 0 ? "امروز" : d === 1 ? "دیروز" : `${F(d)} روز پیش`);

/** پیگیری سفارش با کد پیگیری + موبایل (دیتابیس واقعی؛ در نبود اتصال → جست‌وجوی نمایشی) */
export function TrackView() {
  const q = useRoute((s) => s.q);
  const orders = useData((s) => s.orders);
  const [code, setCode] = useState(q);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<"none" | OrderStatus | "invalid">("none");
  const [found, setFound] = useState("");
  const [dbHit, setDbHit] = useState<TrackedOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const m = dg(phone.trim());
    if (dbReady()) {
      /* پیگیری واقعی — موبایل الزامی (ضد شناسایی سفارش دیگران) */
      if (!m) {
        useUI.getState().say("برای پیگیری آنلاین، موبایل همان سفارش الزامی است");
        return;
      }
      setBusy(true);
      setDbHit(null);
      const res = await dbTrackOrder(c, m);
      setBusy(false);
      if (res.ok) {
        setDbHit(res.order);
        setFound(res.order.code);
        setResult(res.order.status);
        return;
      }
      if (res.error !== "db-off") {
        setResult("invalid");
        return;
      }
      /* اتصال نبود — ادامه با جست‌وجوی نمایشی */
    }
    const o = orders.find((x) => x.code === c);
    if (!o) {
      setResult("invalid");
      return;
    }
    if (m && dg(o.phone) !== m) {
      setResult("invalid");
      return;
    }
    setDbHit(null);
    setFound(c);
    setResult(o.status);
  };

  const o = found && !dbHit ? orders.find((x) => x.code === found) : undefined;
  const cur = result !== "none" && result !== "invalid" ? stepOf(result) : -1;

  return (
    <>
      <Crumb parts={["پیگیری سفارش"]} />
      <div className="w" style={{ maxWidth: 640, paddingTop: 10, paddingBottom: 30 }}>
        <form className="panel fm" onSubmit={search}>
          <b>وضعیت سفارش خود را ببینید</b>
          <div className="two">
            <label>
              کد پیگیری سفارش
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AY-XXXXXX"
                style={{ direction: "ltr", textAlign: "center" }}
                required
              />
            </label>
            <label>
              موبایل همان سفارش
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                placeholder="۰۹۱۲···"
              />
            </label>
          </div>
          <button className="btn" style={{ padding: 12 }} type="submit" disabled={busy}>
            {busy ? "در حال جست‌وجو…" : "پیگیری"}
          </button>
          <small style={{ color: "var(--mute)", display: "grid", gap: 4 }}>
            <span>پیگیری آنلاین = کد پیگیری + موبایل همان سفارش (محرمانه).</span>
            {!dbReady() && (
              <span>
                اتصال دیتابیس برقرار نیست — جست‌وجو در داده‌های نمایشی این دستگاه. نمونهٔ نمایشی:{" "}
                <b style={{ direction: "ltr", display: "inline-block" }}>AY-K3M9X2</b>
              </span>
            )}
          </small>
        </form>

        {result === "invalid" && (
          <div className="panel" style={{ marginTop: 14, textAlign: "center", borderColor: "#dc262666" }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <b>سفارشی با این کد پیدا نشد</b>
            <p style={{ color: "var(--mute)", margin: "6px 0 0" }}>کد پیگیری را از پیامک تأیید سفارش بررسی کنید یا با پشتیبانی تماس بگیرید.</p>
          </div>
        )}

        {dbHit && (
          <div className="panel" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ direction: "ltr" }}>{dbHit.code}</b>
              <span className={"badge " + (dbHit.status === "done" ? "b-ok" : dbHit.status === "sent" ? "b-warn" : dbHit.status === "processing" ? "b-off" : "b-err")}>
                {STATUS_FA[dbHit.status]}
              </span>
              <small style={{ color: "var(--mute)" }}>
                {new Date(dbHit.created_at).toLocaleDateString("fa-IR")}
              </small>
              <b style={{ marginInlineStart: "auto" }}>
                {F(dbHit.total)} <small>تومان</small>
              </b>
            </div>

            {dbHit.status === "canceled" ? (
              <p style={{ color: "#dc2626", marginTop: 12 }}>
                این سفارش لغو شده است. در صورت پرداخت آنلاین، مبلغ تا ۷۲ ساعت کاری به حساب شما بازمی‌گردد.
              </p>
            ) : (
              <div className="tline">
                {STEPS.map(([e, t], i) => (
                  <div key={t} className={"tl" + (i < cur ? " done" : i === cur ? " cur" : "")}>
                    <i>{i < cur ? "✓" : e}</i>
                    <div>
                      <b>{t}</b>
                      <small>
                        {i < cur
                          ? "انجام شد"
                          : i === cur
                            ? dbHit.status === "processing" && i === 1
                              ? "در جریان است — پردازش انبار"
                              : "در جریان است"
                            : "در انتظار"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 6 }}>
              {dbHit.items.map((it) => (
                <div className="ci" key={it.product_id}>
                  <span>
                    {it.emoji} <a href={`#p-${it.product_id}`}>{it.name}</a>
                    <br />
                    <small>
                      {F(it.qty)} × {F(it.price_at_order)}
                    </small>
                  </span>
                  <span>{F(it.price_at_order * it.qty)}</span>
                </div>
              ))}
              {dbHit.discount > 0 && (
                <div className="sum" style={{ color: "var(--ok)" }}>
                  <span>تخفیف</span>
                  <span>−{F(dbHit.discount)}</span>
                </div>
              )}
              <div className="sum">
                <span>ارسال</span>
                <span>{dbHit.shipping ? F(dbHit.shipping) : "رایگان"}</span>
              </div>
              <div className="sum">
                <span>روش ارسال / پرداخت</span>
                <span>
                  {dbHit.ship === "peyk" ? "پیک همان‌روز" : "پست پیشتاز"} · {dbHit.pay === "cod" ? "پرداخت در محل" : "درگاه آنلاین"}
                </span>
              </div>
              {dbHit.addr && (
                <div className="sum">
                  <span>نشانی تحویل</span>
                  <span style={{ maxWidth: 320, textAlign: "left" }}>{dbHit.addr}</span>
                </div>
              )}
              <div className="sum">
                <span>موبایل گیرنده</span>
                <span>{fa(dg(dbHit.phone))}</span>
              </div>
            </div>
          </div>
        )}

        {o && (
          <div className="panel" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <b style={{ direction: "ltr" }}>{o.code}</b>
              <span className={"badge " + (o.status === "done" ? "b-ok" : o.status === "sent" ? "b-warn" : o.status === "processing" ? "b-off" : "b-err")}>
                {STATUS_FA[o.status]}
              </span>
              <small style={{ color: "var(--mute)" }}>{dayFa(o.day)}</small>
              <b style={{ marginInlineStart: "auto" }}>
                {F(o.total)} <small>تومان</small>
              </b>
            </div>

            {o.status === "canceled" ? (
              <p style={{ color: "#dc2626", marginTop: 12 }}>
                این سفارش لغو شده است. در صورت پرداخت آنلاین، مبلغ تا ۷۲ ساعت کاری به حساب شما بازمی‌گردد.
              </p>
            ) : (
              <div className="tline">
                {STEPS.map(([e, t], i) => (
                  <div key={t} className={"tl" + (i < cur ? " done" : i === cur ? " cur" : "")}>
                    <i>{i < cur ? "✓" : e}</i>
                    <div>
                      <b>{t}</b>
                      <small>
                        {i < cur
                          ? "انجام شد"
                          : i === cur
                            ? o.status === "processing" && i === 1
                              ? "در جریان است — پردازش انبار"
                              : "در جریان است"
                            : "در انتظار"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 6 }}>
              {o.lines?.map(([pid, n]) => {
                const p = findProduct(pid);
                if (!p) return null;
                return (
                  <div className="ci" key={pid}>
                    <span>
                      {p.e} <a href={`#p-${p.id}`}>{p.n}</a>
                      <br />
                      <small>
                        {F(n)} × {F(p.p)}
                      </small>
                    </span>
                    <span>{F(p.p * n)}</span>
                  </div>
                );
              })}
              {o.addr && (
                <div className="sum">
                  <span>نشانی تحویل</span>
                  <span style={{ maxWidth: 320, textAlign: "left" }}>{o.addr}</span>
                </div>
              )}
              <div className="sum">
                <span>موبایل گیرنده</span>
                <span>{fa(dg(o.phone))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
