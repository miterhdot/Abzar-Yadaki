"use client";

import { Fragment, useState, type FormEvent } from "react";
import {
  C, CUSTOMERS, MONTH_SALES, OrderStatus, Product, STATUS_FA, WEEK_SALES,
} from "@/data/store";
import { F, dg } from "@/lib/format";
import { useAdmin, useData, useRoute, useUI } from "@/lib/shop-state";
import { LogoMark } from "../bits";

type Tab =
  | "dash" | "products" | "orders" | "customers" | "reviews"
  | "coupons" | "banners" | "messages" | "reports" | "settings";

const TABS: [Tab, string, string][] = [
  ["dash", "📊", "داشبورد"],
  ["products", "📦", "محصولات"],
  ["orders", "🧾", "سفارش‌ها"],
  ["customers", "👥", "مشتریان"],
  ["reviews", "⭐", "نظرات"],
  ["coupons", "🏷️", "کد تخفیف"],
  ["banners", "🖼️", "بنرها"],
  ["messages", "✉️", "پیام‌ها"],
  ["reports", "📈", "گزارش‌ها"],
  ["settings", "⚙️", "تنظیمات"],
];

const dayFa = (d: number) => (d === 0 ? "امروز" : d === 1 ? "دیروز" : `${F(d)} روز پیش`);

function StatusBadge({ s }: { s: OrderStatus }) {
  const cls = s === "done" ? "b-ok" : s === "sent" ? "b-warn" : s === "processing" ? "b-off" : "b-err";
  return <span className={"badge " + cls}>{STATUS_FA[s]}</span>;
}

/* ═══════════ ورود ادمین ═══════════ */

function AdminLogin() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (u.trim() === "admin" && p === "admin123") {
      useAdmin.getState().login();
      useUI.getState().say("خوش آمدید مدیر ✓");
    } else {
      setErr("نام کاربری یا رمز عبور اشتباه است.");
    }
  };

  return (
    <div className="adm-login">
      <form className="panel fm" onSubmit={submit}>
        <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
          <LogoMark size={56} />
          <b style={{ fontSize: 18 }}>پنل مدیریت ابزار یدکی</b>
          <small style={{ color: "var(--mute)" }}>برای ورود، اطلاعات مدیر را وارد کنید</small>
        </div>
        <label>
          نام کاربری
          <input value={u} onChange={(e) => setU(e.target.value)} autoFocus required />
        </label>
        <label>
          رمز عبور
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} required />
        </label>
        {err && <small style={{ color: "#dc2626" }}>{err}</small>}
        <button className="btn" style={{ padding: 12 }} type="submit">
          ورود به پنل
        </button>
        <small style={{ color: "var(--mute)" }}>
          نسخه نمایشی — نام کاربری: <b style={{ direction: "ltr", display: "inline-block" }}>admin</b> و رمز:{" "}
          <b style={{ direction: "ltr", display: "inline-block" }}>admin123</b>
        </small>
        <a href="#home" className="btn ghost">
          ↩ بازگشت به سایت
        </a>
      </form>
    </div>
  );
}

/* ═══════════ فرم محصول (افزودن / ویرایش) ═══════════ */

function ProductForm({ init, onClose }: { init?: Product; onClose: () => void }) {
  const [f, setF] = useState({
    n: init?.n ?? "",
    c: init?.c ?? C[0][1],
    b: init?.b ?? "",
    e: init?.e ?? "🔧",
    p: init?.p ? String(init.p) : "",
    o: init?.o ? String(init.o) : "",
    s: init?.s ?? 1,
    r: init?.r ?? "۴٫۵",
  });

  const save = () => {
    const price = Number(dg(f.p));
    if (!f.n.trim() || !f.b.trim() || !price) {
      useUI.getState().say("نام، برند و قیمت را درست وارد کنید");
      return;
    }
    const data: Product = {
      id: init?.id ?? Math.max(0, ...useData.getState().prods.map((x) => x.id)) + 1,
      n: f.n.trim(),
      c: f.c,
      b: f.b.trim(),
      e: f.e || "🔧",
      p: price,
      o: Number(dg(f.o)) || 0,
      s: f.s,
      r: f.r,
    };
    if (init) {
      useData.getState().updProd(data);
      useUI.getState().say("محصول ویرایش شد ✓");
    } else {
      useData.getState().addProd(data);
      useUI.getState().say("محصول جدید اضافه شد ✓");
    }
    onClose();
  };

  return (
    <div className="mod" onClick={onClose}>
      <div className="panel fm" onClick={(e) => e.stopPropagation()}>
        <b>{init ? "ویرایش محصول" : "افزودن محصول جدید"}</b>
        <div className="two">
          <label>
            نام محصول
            <input value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} autoFocus />
          </label>
          <label>
            دسته
            <select value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })}>
              {C.map(([, n]) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            برند
            <input value={f.b} onChange={(e) => setF({ ...f, b: e.target.value })} />
          </label>
          <label>
            آیکون (ایموجی)
            <input value={f.e} onChange={(e) => setF({ ...f, e: e.target.value })} maxLength={4} style={{ textAlign: "center" }} />
          </label>
        </div>
        <div className="two">
          <label>
            قیمت (تومان)
            <input value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} inputMode="numeric" placeholder="185000" />
          </label>
          <label>
            قیمت قبل از تخفیف (0 = ندارد)
            <input value={f.o} onChange={(e) => setF({ ...f, o: e.target.value })} inputMode="numeric" placeholder="0" />
          </label>
        </div>
        <div className="two">
          <label>
            وضعیت موجودی
            <select value={f.s} onChange={(e) => setF({ ...f, s: Number(e.target.value) })}>
              <option value={1}>موجود · ارسال امروز</option>
              <option value={0}>موجود در انبار</option>
            </select>
          </label>
          <label>
            امتیاز
            <input value={f.r} onChange={(e) => setF({ ...f, r: e.target.value })} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="button" onClick={save} style={{ flex: 1 }}>
            ذخیره
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ خود پنل ═══════════ */

export function AdminApp() {
  const logged = useAdmin((s) => s.logged);
  const [tab, setTab] = useState<Tab>("dash");
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [openOrder, setOpenOrder] = useState("");
  const [prodModal, setProdModal] = useState<Product | "new" | null>(null);
  const [qProd, setQProd] = useState("");
  const say = useUI((s) => s.say);

  const prods = useData((s) => s.prods);
  const orders = useData((s) => s.orders);
  const reviews = useData((s) => s.reviews);
  const coupons = useData((s) => s.coupons);
  const banners = useData((s) => s.banners);
  const msgs = useData((s) => s.msgs);
  const settings = useData((s) => s.settings);

  if (!logged) return <AdminLogin />;

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders;
  const unread = msgs.filter((m) => m.unread).length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const todaySale = 12450000;
  const maxSale = Math.max(...WEEK_SALES.map(([, v]) => v));
  const maxMonth = Math.max(...MONTH_SALES.map(([, v]) => v));
  const outOfStock = prods.filter((p) => !p.s);
  const prodsList = prods.filter((p) => !qProd || p.n.includes(qProd) || p.b.includes(qProd));

  /* گزارش‌ها */
  const doneTotal = orders.filter((o) => o.status === "done").reduce((a, o) => a + o.total, 0);
  const statusCount = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const topMap = new Map<number, number>();
  orders.forEach((o) => o.lines?.forEach(([pid, n]) => topMap.set(pid, (topMap.get(pid) ?? 0) + n)));
  const topItems = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catCount = C.map(([e, n]) => [n, prods.filter((p) => p.c === n).length] as const);
  const maxCat = Math.max(1, ...catCount.map(([, v]) => v));

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
            {id === "messages" && unread > 0 ? <span className="badge b-err">{F(unread)}</span> : null}
            {id === "reviews" && pendingReviews > 0 ? <span className="badge b-warn">{F(pendingReviews)}</span> : null}
          </button>
        ))}
        <div className="sep" />
        <button type="button" onClick={() => { useAdmin.getState().logout(); say("از پنل خارج شدید"); }}>
          🚪 خروج از پنل
        </button>
        <a href="#home">↩️ بازگشت به سایت</a>
      </aside>

      <main className="adm-main">
        {/* ── داشبورد ── */}
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
                <b>{F(orders.filter((o) => o.day === 0).length)}</b>
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
                    {outOfStock.length === 0 ? (
                      <tr>
                        <td>همه محصولات موجودند ✓</td>
                      </tr>
                    ) : (
                      outOfStock.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.e} {p.n}
                          </td>
                          <td>
                            <span className="badge b-err">انبار</span>
                          </td>
                          <td>
                            <button
                              className="btn"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              type="button"
                              onClick={() => { useData.getState().updProd({ ...p, s: 1 }); say(`«${p.n}» موجود شد ✓`); }}
                            >
                              افزودن موجودی
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
                  {orders.slice(0, 5).map((o) => (
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

        {/* ── محصولات ── */}
        {tab === "products" && (
          <>
            <div className="adm-top">
              <h1>محصولات ({F(prods.length)})</h1>
              <button className="btn" type="button" onClick={() => setProdModal("new")}>
                + افزودن محصول
              </button>
            </div>
            <input
              value={qProd}
              onChange={(e) => setQProd(e.target.value)}
              placeholder="جستجوی نام یا برند..."
              style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit", background: "var(--card)", color: "var(--ink)", width: "100%", marginBottom: 12 }}
            />
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
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
                  {prodsList.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.e} <b>{p.n}</b>
                      </td>
                      <td>{p.c}</td>
                      <td>{p.b}</td>
                      <td>{F(p.p)}</td>
                      <td>{p.s ? <span className="badge b-ok">موجود</span> : <span className="badge b-off">انبار</span>}</td>
                      <td>⭐ {p.r}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} type="button" onClick={() => setProdModal(p)}>
                          ویرایش
                        </button>{" "}
                        <button
                          className="btn ghost"
                          style={{ padding: "3px 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                          type="button"
                          onClick={() => {
                            if (confirm(`حذف «${p.n}»؟`)) {
                              useData.getState().delProd(p.id);
                              say("محصول حذف شد");
                            }
                          }}
                        >
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

        {/* ── سفارش‌ها ── */}
        {tab === "orders" && (
          <>
            <div className="adm-top">
              <h1>سفارش‌ها ({F(orders.length)})</h1>
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
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
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
                  {filteredOrders.map((o) => (
                    <FragmentRow
                      key={o.code}
                      code={o.code}
                      open={openOrder === o.code}
                      onToggle={() => setOpenOrder(openOrder === o.code ? "" : o.code)}
                      cells={[
                        <b key="c">{o.code}</b>,
                        o.name,
                        o.phone,
                        F(o.items),
                        F(o.total),
                        dayFa(o.day),
                        <StatusBadge key="s" s={o.status} />,
                      ]}
                      detail={
                        <>
                          {o.lines?.map(([pid, n]) => {
                            const p = useData.getState().prods.find((x) => x.id === pid);
                            return (
                              <div className="sum" key={pid}>
                                <span>
                                  {p ? `${p.e} ${p.n}` : `کالا #${pid}`} × {F(n)}
                                </span>
                                <span>{p ? F(p.p * n) : "—"}</span>
                              </div>
                            );
                          })}
                          <div className="sum">
                            <span>نشانی</span>
                            <span style={{ maxWidth: 340, textAlign: "left" }}>{o.addr ?? "—"}</span>
                          </div>
                          <div className="sum">
                            <span>روش ارسال / پرداخت</span>
                            <span>
                              {o.ship === "peyk" ? "پیک" : "پست"} · {o.pay === "cod" ? "در محل" : "آنلاین"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                            <small style={{ width: "100%", color: "var(--mute)" }}>تغییر وضعیت سفارش:</small>
                            {(["processing", "sent", "done", "canceled"] as OrderStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={o.status === s ? "btn" : "btn ghost"}
                                style={{ padding: "5px 12px", fontSize: 12 }}
                                onClick={() => { useData.getState().setOrderStatus(o.code, s); say(`وضعیت ${o.code} → ${STATUS_FA[s]}`); }}
                              >
                                {STATUS_FA[s]}
                              </button>
                            ))}
                          </div>
                        </>
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── مشتریان ── */}
        {tab === "customers" && (
          <>
            <div className="adm-top">
              <h1>مشتریان ({F(CUSTOMERS.length)})</h1>
            </div>
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
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

        {/* ── نظرات ── */}
        {tab === "reviews" && (
          <>
            <div className="adm-top">
              <h1>نظرات ({F(reviews.length)})</h1>
              <small style={{ color: "var(--mute)" }}>نظرات تأییدشده در صفحه محصول نمایش داده می‌شوند</small>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {reviews.map((r) => {
                const p = prods.find((x) => x.id === r.pid);
                return (
                  <div className="panel" key={r.id} style={{ padding: 14 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{r.name}</b>
                      <small style={{ color: "var(--mute)" }}>برای {p ? p.n : `کالا #${r.pid}`}</small>
                      <span className={"badge " + (r.status === "ok" ? "b-ok" : r.status === "pending" ? "b-warn" : "b-err")}>
                        {r.status === "ok" ? "تأیید شده" : r.status === "pending" ? "در انتظار تأیید" : "رد شده"}
                      </span>
                      <span style={{ marginInlineStart: "auto" }}>⭐ {r.r}</span>
                    </div>
                    <p style={{ margin: "8px 0", color: "var(--mute)" }}>{r.text}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {r.status !== "ok" && (
                        <button
                          className="btn"
                          style={{ padding: "5px 14px", fontSize: 12 }}
                          type="button"
                          onClick={() => { useData.getState().setReviewStatus(r.id, "ok"); say("نظر تأیید شد ✓"); }}
                        >
                          ✔ تأیید
                        </button>
                      )}
                      {r.status !== "no" && (
                        <button
                          className="btn ghost"
                          style={{ padding: "5px 14px", fontSize: 12 }}
                          type="button"
                          onClick={() => { useData.getState().setReviewStatus(r.id, "no"); say("نظر رد شد"); }}
                        >
                          ✖ رد
                        </button>
                      )}
                      <button
                        className="btn ghost"
                        style={{ padding: "5px 14px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                        type="button"
                        onClick={() => { useData.getState().delReview(r.id); say("نظر حذف شد"); }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── کد تخفیف ── */}
        {tab === "coupons" && (
          <>
            <div className="adm-top">
              <h1>کدهای تخفیف ({F(coupons.length)})</h1>
            </div>
            <CouponAdd />
            <div className="panel" style={{ padding: 8, marginTop: 12 }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>درصد</th>
                    <th>سقف تخفیف (تومان)</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <b style={{ direction: "ltr", display: "inline-block" }}>{c.code}</b>
                      </td>
                      <td>٪{F(c.percent)}</td>
                      <td>{F(c.max)}</td>
                      <td>{c.active ? <span className="badge b-ok">فعال</span> : <span className="badge b-off">غیرفعال</span>}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} type="button" onClick={() => useData.getState().toggleCoupon(c.code)}>
                          {c.active ? "غیرفعال کن" : "فعال کن"}
                        </button>{" "}
                        <button
                          className="btn ghost"
                          style={{ padding: "3px 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                          type="button"
                          onClick={() => { useData.getState().delCoupon(c.code); say("کد حذف شد"); }}
                        >
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

        {/* ── بنرها ── */}
        {tab === "banners" && (
          <>
            <div className="adm-top">
              <h1>بنرهای صفحه اصلی</h1>
            </div>
            <BannerAdd />
            <div className="adm-cols" style={{ marginTop: 12 }}>
              {banners.map((b) => (
                <div className="panel" key={b.id} style={{ padding: 14 }}>
                  <a
                    href={b.href}
                    onClick={(e) => e.preventDefault()}
                    style={{ background: b.bg, borderRadius: 14, padding: 16, color: "#fff", display: "block", marginBottom: 10 }}
                  >
                    <b>{b.t}</b>
                    <br />
                    {b.d}
                  </a>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {b.active ? <span className="badge b-ok">فعال</span> : <span className="badge b-off">غیرفعال</span>}
                    <small style={{ color: "var(--mute)", direction: "ltr" }}>{b.href}</small>
                    <button className="btn ghost" style={{ padding: "4px 12px", fontSize: 12, marginInlineStart: "auto" }} type="button" onClick={() => useData.getState().toggleBanner(b.id)}>
                      {b.active ? "پنهان کن" : "نمایش بده"}
                    </button>
                    <button
                      className="btn ghost"
                      style={{ padding: "4px 12px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                      type="button"
                      onClick={() => { useData.getState().delBanner(b.id); say("بنر حذف شد"); }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── پیام‌ها ── */}
        {tab === "messages" && (
          <>
            <div className="adm-top">
              <h1>
                پیام‌های تماس با ما {unread > 0 && <span className="badge b-err">{F(unread)} خوانده‌نشده</span>}
              </h1>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {msgs.length === 0 && <div className="panel">پیامی وجود ندارد.</div>}
              {msgs.map((m) => (
                <div className="panel" key={m.id} style={{ padding: 14, borderColor: m.unread ? "var(--or)" : undefined }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <b>{m.name}</b>
                    <small style={{ color: "var(--mute)" }}>{m.phone}</small>
                    <span className="badge b-off">{m.subject}</span>
                    {m.unread && <span className="badge b-err">جدید</span>}
                    <small style={{ marginInlineStart: "auto", color: "var(--mute)" }}>{dayFa(m.day)}</small>
                  </div>
                  <p style={{ margin: "8px 0", color: "var(--ink)" }}>{m.text}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {m.unread && (
                      <button className="btn" style={{ padding: "5px 14px", fontSize: 12 }} type="button" onClick={() => useData.getState().readMsg(m.id)}>
                        ✔ خوانده شد
                      </button>
                    )}
                    <button
                      className="btn ghost"
                      style={{ padding: "5px 14px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                      type="button"
                      onClick={() => { useData.getState().delMsg(m.id); say("پیام حذف شد"); }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── گزارش‌ها ── */}
        {tab === "reports" && (
          <>
            <div className="adm-top">
              <h1>گزارش فروش</h1>
            </div>
            <div className="adm-stats">
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مجموع فروش سفارش‌های تحویل‌شده</small>
                <b>{F(doneTotal)}</b>
                <small>تومان</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مجموع سفارش‌ها</small>
                <b>{F(orders.length)}</b>
                <small>سفارش</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>میانگین سبد خرید</small>
                <b>{F(Math.round(orders.reduce((a, o) => a + o.total, 0) / Math.max(1, orders.length)))}</b>
                <small>تومان</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>تعداد محصولات</small>
                <b>{F(prods.length)}</b>
                <small>کالا</small>
              </div>
            </div>
            <div className="adm-cols">
              <div className="panel">
                <b>فروش ۶ ماه اخیر (میلیون تومان)</b>
                <div className="adm-chart" style={{ marginTop: 14 }}>
                  {MONTH_SALES.map(([d, v], i) => (
                    <div key={d} className={i === MONTH_SALES.length - 1 ? "hot" : ""}>
                      <i style={{ height: `${(v / maxMonth) * 100}%` }} />
                      <small>{F(v)}</small>
                      <small>{d}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <b>وضعیت سفارش‌ها</b>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {(Object.keys(STATUS_FA) as OrderStatus[]).map((s) => (
                    <div key={s}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>{STATUS_FA[s]}</span>
                        <b>{F(statusCount(s))}</b>
                      </div>
                      <div className="prog">
                        <i
                          style={{
                            width: `${(statusCount(s) / Math.max(1, orders.length)) * 100}%`,
                            background: s === "canceled" ? "#dc2626" : s === "done" ? "var(--ok)" : "var(--or)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <b>پرفروش‌ترین کالاها (بر اساس اقلام سفارش‌ها)</b>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>محصول</th>
                    <th>تعداد فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length === 0 && (
                    <tr>
                      <td colSpan={3}>هنوز سفارشی با اقلام ثبت نشده است.</td>
                    </tr>
                  )}
                  {topItems.map(([pid, n], i) => {
                    const p = prods.find((x) => x.id === pid);
                    return (
                      <tr key={pid}>
                        <td>{F(i + 1)}</td>
                        <td>
                          {p ? `${p.e} ${p.n}` : `کالا #${pid}`}
                        </td>
                        <td>
                          <b>{F(n)}</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <b>سهم دسته‌بندی‌ها از محصولات</b>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {catCount.map(([n, v]) => (
                  <div key={n}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{n}</span>
                      <b>{F(v)} کالا</b>
                    </div>
                    <div className="prog">
                      <i style={{ width: `${(v / maxCat) * 100}%`, background: "var(--navy2)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── تنظیمات ── */}
        {tab === "settings" && <SettingsTab />}
      </main>

      {prodModal && <ProductForm init={prodModal === "new" ? undefined : prodModal} onClose={() => setProdModal(null)} />}
    </div>
  );
}

/* ── ردیف سفارش با جزئیات بازشو ── */

function FragmentRow({
  code, open, onToggle, cells, detail,
}: {
  code: string;
  open: boolean;
  onToggle: () => void;
  cells: React.ReactNode[];
  detail: React.ReactNode;
}) {
  return (
    <Fragment key={code}>
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        {cells.map((c, i) => (
          <td key={i}>{c}</td>
        ))}
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: "var(--bg)", borderRadius: 10 }}>
            <div style={{ padding: 10 }}>{detail}</div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/* ── افزودن کد تخفیف ── */

function CouponAdd() {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [max, setMax] = useState("300000");

  const add = () => {
    const c = code.trim().toUpperCase();
    const pc = Number(dg(percent));
    const mx = Number(dg(max));
    if (!c || !pc || !mx) {
      useUI.getState().say("کد، درصد و سقف را درست وارد کنید");
      return;
    }
    if (useData.getState().coupons.some((x) => x.code === c)) {
      useUI.getState().say("این کد قبلاً ثبت شده");
      return;
    }
    useData.getState().addCoupon({ code: c, percent: pc, max: mx, active: true });
    useUI.getState().say("کد تخفیف ساخته شد ✓");
    setCode("");
  };

  return (
    <div className="panel fm">
      <b>ساخت کد تخفیف جدید</b>
      <div className="two">
        <label>
          کد (لاتین)
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="NOWRUZ" style={{ direction: "ltr" }} />
        </label>
        <label>
          درصد تخفیف
          <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" />
        </label>
      </div>
      <label>
        سقف تخفیف (تومان)
        <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" />
      </label>
      <button className="btn" type="button" onClick={add}>
        + ساخت کد
      </button>
    </div>
  );
}

/* ── افزودن بنر ── */

function BannerAdd() {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  const [href, setHref] = useState("#offers");
  const [bg, setBg] = useState("linear-gradient(135deg,#ff6a1a,#c2410c)");

  const add = () => {
    if (!t.trim()) {
      useUI.getState().say("عنوان بنر را وارد کنید");
      return;
    }
    useData.getState().addBanner({ id: Date.now(), t: t.trim(), d: d.trim(), href, bg, active: true });
    useUI.getState().say("بنر اضافه شد ✓");
    setT("");
    setD("");
  };

  return (
    <div className="panel fm">
      <b>بنر جدید</b>
      <div className="two">
        <label>
          عنوان
          <input value={t} onChange={(e) => setT(e.target.value)} placeholder="⚡ تخفیف پاییزی" />
        </label>
        <label>
          توضیح کوتاه
          <input value={d} onChange={(e) => setD(e.target.value)} placeholder="تا ۳۰٪ تخفیف" />
        </label>
      </div>
      <div className="two">
        <label>
          لینک مقصد
          <select value={href} onChange={(e) => setHref(e.target.value)}>
            <option value="#offers">تخفیف‌ها</option>
            <option value="#cats">دسته‌بندی‌ها</option>
            <option value="#shop">فروشگاه</option>
            <option value="#contact">تماس با ما</option>
          </select>
        </label>
        <label>
          رنگ پس‌زمینه
          <select value={bg} onChange={(e) => setBg(e.target.value)}>
            <option value="linear-gradient(135deg,#ff6a1a,#c2410c)">نارنجی</option>
            <option value="linear-gradient(135deg,#143a66,#0b1f3a)">سرمه‌ای</option>
            <option value="linear-gradient(135deg,#17a05d,#0e7a45)">سبز</option>
          </select>
        </label>
      </div>
      <button className="btn" type="button" onClick={add}>
        + افزودن بنر
      </button>
    </div>
  );
}

/* ── تنظیمات فروشگاه ── */

function SettingsTab() {
  const settings = useData((s) => s.settings);
  const [f, setF] = useState({
    ann: settings.ann,
    phone: settings.phone,
    free: String(settings.free),
    shipPost: String(settings.shipPost),
    shipPeyk: String(settings.shipPeyk),
  });

  const save = () => {
    const free = Number(dg(f.free));
    const post = Number(dg(f.shipPost));
    const peyk = Number(dg(f.shipPeyk));
    if (!free || !post || !peyk || !f.ann.trim()) {
      useUI.getState().say("همه مقادیر را درست وارد کنید");
      return;
    }
    useData.getState().saveSettings({ ann: f.ann.trim(), phone: f.phone.trim(), free, shipPost: post, shipPeyk: peyk });
    useUI.getState().say("تنظیمات ذخیره شد ✓");
  };

  return (
    <>
      <div className="adm-top">
        <h1>تنظیمات فروشگاه</h1>
      </div>
      <div className="panel fm" style={{ maxWidth: 560 }}>
        <label>
          متن نوار اعلان بالای سایت
          <input value={f.ann} onChange={(e) => setF({ ...f, ann: e.target.value })} />
        </label>
        <label>
          تلفن فروشگاه
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </label>
        <label>
          سقف ارسال رایگان (تومان)
          <input value={f.free} onChange={(e) => setF({ ...f, free: e.target.value })} inputMode="numeric" />
        </label>
        <div className="two">
          <label>
            هزینه پست پیشتاز (تومان)
            <input value={f.shipPost} onChange={(e) => setF({ ...f, shipPost: e.target.value })} inputMode="numeric" />
          </label>
          <label>
            هزینه پیک همان‌روز (تومان)
            <input value={f.shipPeyk} onChange={(e) => setF({ ...f, shipPeyk: e.target.value })} inputMode="numeric" />
          </label>
        </div>
        <button className="btn" type="button" onClick={save}>
          ذخیره تنظیمات
        </button>
        <small style={{ color: "var(--mute)" }}>
          تغییرات بلافاصله در سایت اعمال می‌شود: نوار اعلان، سبد خرید، صفحه محصول و تسویه‌حساب.
        </small>
      </div>
    </>
  );
}
