"use client";

import { useState, type FormEvent } from "react";
import { STATUS_FA, OrderStatus } from "@/data/store";
import { F, dg, fa } from "@/lib/format";
import { findProduct, useAuth, useData, useRoute, useUI } from "@/lib/shop-state";
import { Crumb } from "../bits-helper";

const dayFa = (d: number) => (d === 0 ? "امروز" : d === 1 ? "دیروز" : `${F(d)} روز پیش`);

function StatusBadge({ s }: { s: OrderStatus }) {
  const cls = s === "done" ? "b-ok" : s === "sent" ? "b-warn" : s === "processing" ? "b-off" : "b-err";
  return <span className={"badge " + cls}>{STATUS_FA[s]}</span>;
}

type Tab = "orders" | "addr" | "info";

/** حساب من — سفارش‌ها، آدرس‌ها، اطلاعات حساب */
export function AccountView() {
  const user = useAuth((s) => s.user);
  const orders = useData((s) => s.orders);
  const addresses = useData((s) => s.addresses);
  const go = useRoute((s) => s.go);
  const [tab, setTab] = useState<Tab>("orders");
  const [open, setOpen] = useState("");

  if (!user)
    return (
      <>
        <Crumb parts={["حساب من"]} />
        <div className="w" style={{ maxWidth: 460, paddingTop: 10, paddingBottom: 30 }}>
          <div className="panel" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44 }}>👤</div>
            <h2 style={{ justifyContent: "center" }}>برای دیدن حساب کاربری، وارد شوید</h2>
            <p style={{ color: "var(--mute)" }}>سفارش‌های من، آدرس‌ها و اطلاعات حساب شما اینجا نگه‌داری می‌شود.</p>
            <a className="btn" href="#auth">
              ورود / ثبت‌نام
            </a>
          </div>
        </div>
      </>
    );

  const mine = orders.filter((o) => dg(o.phone) === dg(user.phone));

  return (
    <>
      <Crumb parts={["حساب من"]} />
      <div className="w">
        <div className="panel" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 34 }}>👤</span>
          <div style={{ flex: 1 }}>
            <b>{user.name}</b>
            <br />
            <small style={{ color: "var(--mute)" }}>{fa(dg(user.phone))}</small>
          </div>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              useAuth.getState().logout();
              useUI.getState().say("از حساب خارج شدید");
              go("home", { q: "" });
            }}
          >
            خروج
          </button>
        </div>

        <div className="bar" style={{ marginTop: 14 }}>
          <button type="button" className={tab === "orders" ? "on" : ""} onClick={() => setTab("orders")}>
            🧾 سفارش‌های من ({F(mine.length)})
          </button>
          <button type="button" className={tab === "addr" ? "on" : ""} onClick={() => setTab("addr")}>
            📍 آدرس‌های من ({F(addresses.filter((a) => dg(a.phone) === dg(user.phone)).length)})
          </button>
          <button type="button" className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>
            ⚙️ اطلاعات حساب
          </button>
        </div>

        {tab === "orders" && (
          <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
            {mine.length === 0 && (
              <div className="panel" style={{ textAlign: "center" }}>
                <p style={{ color: "var(--mute)" }}>هنوز سفارشی ثبت نکرده‌اید.</p>
                <a className="btn" href="#shop">
                  رفتن به فروشگاه
                </a>
              </div>
            )}
            {mine.map((o) => (
              <div className="panel" key={o.code} style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ direction: "ltr" }}>{o.code}</b>
                  <StatusBadge s={o.status} />
                  <small style={{ color: "var(--mute)" }}>{dayFa(o.day)}</small>
                  <b style={{ marginInlineStart: "auto" }}>
                    {F(o.total)} <small>تومان</small>
                  </b>
                  <button
                    className="btn ghost"
                    style={{ padding: "5px 12px", fontSize: 13 }}
                    type="button"
                    onClick={() => setOpen(open === o.code ? "" : o.code)}
                  >
                    {open === o.code ? "بستن" : "جزئیات"}
                  </button>
                </div>
                {open === o.code && (
                  <div style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 8 }}>
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
                    <div className="sum">
                      <span>روش ارسال</span>
                      <span>{o.ship === "peyk" ? "پیک همان‌روز" : "پست پیشتاز"}</span>
                    </div>
                    <div className="sum">
                      <span>روش پرداخت</span>
                      <span>{o.pay === "cod" ? "پرداخت در محل" : "درگاه آنلاین"}</span>
                    </div>
                    {o.addr && (
                      <div className="sum">
                        <span>نشانی</span>
                        <span style={{ maxWidth: 320, textAlign: "left" }}>{o.addr}</span>
                      </div>
                    )}
                    <a className="btn ghost" style={{ marginTop: 8, display: "inline-block" }} href="#track" onClick={() => go("track", { q: o.code })}>
                      📦 پیگیری سفارش
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "addr" && <AddrTab />}
        {tab === "info" && <InfoTab />}
      </div>
    </>
  );
}

function AddrTab() {
  const user = useAuth((s) => s.user);
  const addresses = useData((s) => s.addresses);
  const mine = addresses.filter((a) => user && dg(a.phone) === dg(user.phone));

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget.elements;
    const title = (el.namedItem("t") as HTMLInputElement).value.trim();
    const text = (el.namedItem("x") as HTMLTextAreaElement).value.trim();
    if (!user) return;
    useData.getState().addAddress({ id: Date.now(), phone: user.phone, title, text });
    useUI.getState().say("آدرس ذخیره شد ✓");
    e.currentTarget.reset();
  };

  return (
    <div className="lay" style={{ marginTop: 12 }}>
      <div style={{ display: "grid", gap: 12 }}>
        {mine.length === 0 && <div className="panel">هنوز آدرسی ثبت نکرده‌اید.</div>}
        {mine.map((a) => (
          <div className="panel" key={a.id} style={{ padding: 14 }}>
            <b>📍 {a.title}</b>
            <p style={{ margin: "4px 0", color: "var(--mute)" }}>{a.text}</p>
            <button
              className="btn ghost"
              style={{ padding: "4px 12px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
              type="button"
              onClick={() => {
                useData.getState().delAddress(a.id);
                useUI.getState().say("آدرس حذف شد");
              }}
            >
              حذف
            </button>
          </div>
        ))}
      </div>
      <form className="panel fm" onSubmit={add}>
        <b>افزودن آدرس جدید</b>
        <label>
          عنوان (خانه، محل کار...)
          <input name="t" required />
        </label>
        <label>
          نشانی کامل
          <textarea name="x" rows={3} required />
        </label>
        <button className="btn" type="submit">
          ذخیره آدرس
        </button>
      </form>
    </div>
  );
}

function InfoTab() {
  const user = useAuth((s) => s.user)!;

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = (e.currentTarget.elements.namedItem("n") as HTMLInputElement).value.trim();
    if (name.length < 3) {
      useUI.getState().say("نام را کامل وارد کنید");
      return;
    }
    useData.getState().upsertUser(name, user.phone);
    useAuth.getState().login({ ...user, name });
    useUI.getState().say("اطلاعات حساب به‌روز شد ✓");
  };

  return (
    <form className="panel fm" style={{ maxWidth: 460, marginTop: 12 }} onSubmit={save}>
      <label>
        نام و نام خانوادگی
        <input name="n" defaultValue={user.name} required />
      </label>
      <label>
        شماره موبایل (غیرقابل تغییر)
        <input value={fa(dg(user.phone))} disabled />
      </label>
      <button className="btn" type="submit">
        ذخیره تغییرات
      </button>
    </form>
  );
}
