"use client";

import { useState } from "react";
import { CUSTOMERS, ORDERS, P, STATUS_FA, OrderStatus, WEEK_SALES } from "@/data/store";
import { F } from "@/lib/format";
import { useUI } from "@/lib/shop-state";
import { LogoMark } from "../bits";

type Tab = "dash" | "products" | "orders" | "customers";

const TABS: [Tab, string, string][] = [
  ["dash", "📊", "داشبورد"],
  ["products", "📦", "محصولات"],
  ["orders", "🧾", "سفارش‌ها"],
  ["customers", "👥", "مشتریان"],
];

function StatusBadge({ s }: { s: OrderStatus }) {
  const cls = s === "done" ? "b-ok" : s === "sent" ? "b-warn" : s === "processing" ? "b-off" : "b-err";
  return <span className={"badge " + cls}>{STATUS_FA[s]}</span>;
}

export function AdminApp() {
  const [tab, setTab] = useState<Tab>("dash");
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const say = useUI((s) => s.say);

  const orders = filter ? ORDERS.filter((o) => o.status === filter) : ORDERS;
  const todaySale = 12450000;
  const maxSale = Math.max(...WEEK_SALES.map(([, v]) => v));
  const outOfStock = P.filter((p) => !p.s);

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <LogoMark size={34} />
          پنل مدیریت
        </div>
        {TABS.map(([id, e, label]) => (
          <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <span>{e}</span> {label}
          </button>
        ))}
        <div className="sep" />
        <a href="#home">↩️ بازگشت به سایت</a>
      </aside>

      <main className="adm-main">
        {tab === "dash" && (
          <>
            <div className="adm-top">
              <h1>داشبورد</h1>
              <small style={{ color: "var(--mute)" }}>داده‌های نمایشی — متصل به نسخه نهایی</small>
            </div>
            <div className="adm-stats">
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>فروش امروز</small>
                <b>{F(todaySale)}</b>
                <small>تومان · </small>
                <small className="up">↑ ۱۲٪ نسبت به دیروز</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>سفارش‌های جدید</small>
                <b>{F(7)}</b>
                <small className="up">↑ ۳ مورد</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مشتریان</small>
                <b>{F(1248)}</b>
                <small className="up">↑ ۱۸ امروز</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>بازدید امروز</small>
                <b>{F(3940)}</b>
                <small className="down">↓ ۴٪</small>
              </div>
            </div>
            <div className="adm-cols">
              <div className="panel">
                <b>فروش ۷ روز اخیر (میلیون تومان)</b>
                <div className="adm-chart" style={{ marginTop: 14 }}>
                  {WEEK_SALES.map(([d, v], i) => (
                    <div key={d} className={i === WEEK_SALES.length - 1 ? "hot" : ""}>
                      <i style={{ height: `${(v / maxSale) * 100}%` }} />
                      <small>{F(Math.round(v))}</small>
                      <small>{d}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <b>موجودی بحرانی</b>
                <table className="adm-table">
                  <tbody>
                    {outOfStock.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.e} {p.n}
                        </td>
                        <td>
                          <span className="badge b-err">ناموجود</span>
                        </td>
                        <td>
                          <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} type="button" onClick={() => say("در نسخه نهایی به انبار متصل می‌شود")}>
                            افزودن موجودی
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <b>آخرین سفارش‌ها</b>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>مشتری</th>
                    <th>اقلام</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.slice(0, 5).map((o) => (
                    <tr key={o.code}>
                      <td>{o.code}</td>
                      <td>{o.name}</td>
                      <td>{F(o.items)}</td>
                      <td>{F(o.total)}</td>
                      <td>
                        <StatusBadge s={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "products" && (
          <>
            <div className="adm-top">
              <h1>محصولات ({F(P.length)})</h1>
              <button className="btn" type="button" onClick={() => say("فرم افزودن محصول در نسخه نهایی فعال می‌شود")}>
                + افزودن محصول
              </button>
            </div>
            <div className="panel" style={{ padding: 8 }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>دسته</th>
                    <th>برند</th>
                    <th>قیمت</th>
                    <th>موجودی</th>
                    <th>امتیاز</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {P.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.e} <b>{p.n}</b>
                      </td>
                      <td>{p.c}</td>
                      <td>{p.b}</td>
                      <td>{F(p.p)}</td>
                      <td>{p.s ? <span className="badge b-ok">موجود</span> : <span className="badge b-off">انبار</span>}</td>
                      <td>⭐ {p.r}</td>
                      <td>
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} type="button" onClick={() => say("ویرایش در نسخه نهایی")}>
                          ویرایش
                        </button>{" "}
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }} type="button" onClick={() => say("حذف در نسخه نهایی")}>
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="adm-top">
              <h1>سفارش‌ها</h1>
              <div className="bar" style={{ marginBottom: 0 }}>
                <button type="button" className={filter ? "" : "on"} onClick={() => setFilter("")}>
                  همه
                </button>
                {(Object.keys(STATUS_FA) as OrderStatus[]).map((s) => (
                  <button key={s} type="button" className={filter === s ? "on" : ""} onClick={() => setFilter(s)}>
                    {STATUS_FA[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel" style={{ padding: 8 }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>مشتری</th>
                    <th>موبایل</th>
                    <th>اقلام</th>
                    <th>مبلغ (تومان)</th>
                    <th>زمان</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.code}>
                      <td>
                        <b>{o.code}</b>
                      </td>
                      <td>{o.name}</td>
                      <td>{o.phone}</td>
                      <td>{F(o.items)}</td>
                      <td>{F(o.total)}</td>
                      <td>{o.day === 0 ? "امروز" : o.day === 1 ? "دیروز" : `${F(o.day)} روز پیش`}</td>
                      <td>
                        <StatusBadge s={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "customers" && (
          <>
            <div className="adm-top">
              <h1>مشتریان ({F(CUSTOMERS.length)})</h1>
            </div>
            <div className="panel" style={{ padding: 8 }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>موبایل</th>
                    <th>شهر</th>
                    <th>سفارش‌ها</th>
                    <th>مجموع خرید (تومان)</th>
                    <th>آخرین خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {CUSTOMERS.map((c) => (
                    <tr key={c.phone}>
                      <td>
                        <b>{c.name}</b>
                      </td>
                      <td>{c.phone}</td>
                      <td>{c.city}</td>
                      <td>{F(c.orders)}</td>
                      <td>{F(c.spent)}</td>
                      <td>{c.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
