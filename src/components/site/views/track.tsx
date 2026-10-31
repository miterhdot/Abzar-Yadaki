"use client";

import { useState, type FormEvent } from "react";
import { STATUS_FA, OrderStatus } from "@/data/store";
import { F, dg, fa } from "@/lib/format";
import { findProduct, useData, useRoute } from "@/lib/shop-state";
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

/** پیگیری سفارش با کد پیگیری */
export function TrackView() {
  const q = useRoute((s) => s.q);
  const orders = useData((s) => s.orders);
  const [code, setCode] = useState(q);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<"none" | OrderStatus | "invalid">("none");
  const [found, setFound] = useState("");

  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const m = dg(phone.trim());
    const o = orders.find((x) => x.code === c);
    if (!o) {
      setResult("invalid");
      return;
    }
    if (m && dg(o.phone) !== m) {
      setResult("invalid");
      return;
    }
    setFound(c);
    setResult(o.status);
  };

  const o = found ? orders.find((x) => x.code === found) : undefined;
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
              موبایل (اختیاری)
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                placeholder="۰۹۱۲···"
              />
            </label>
          </div>
          <button className="btn" style={{ padding: 12 }} type="submit">
            پیگیری
          </button>
          <small style={{ color: "var(--mute)" }}>
            نمونه برای تست: <b style={{ direction: "ltr", display: "inline-block" }}>AY-K3M9X2</b> یا کد سفارش خودتان پس از خرید.
          </small>
        </form>

        {result === "invalid" && (
          <div className="panel" style={{ marginTop: 14, textAlign: "center", borderColor: "#dc262666" }}>
            <div style={{ fontSize: 36 }}>🔍</div>
            <b>سفارشی با این کد پیدا نشد</b>
            <p style={{ color: "var(--mute)", margin: "6px 0 0" }}>کد پیگیری را از پیامک تأیید سفارش بررسی کنید یا با پشتیبانی تماس بگیرید.</p>
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
