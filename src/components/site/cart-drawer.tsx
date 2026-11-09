"use client";

import { useEffect } from "react";
import { F } from "@/lib/format";
import { cartCount, cartTotal, findProduct, useCart, useData, useRoute, useUI } from "@/lib/shop-state";

/** Cart drawer — 1:1 from design (side panel on desktop, bottom sheet on mobile) */
export function CartDrawer() {
  const open = useUI((s) => s.drawer);
  const dr = useUI((s) => s.dr);
  const rdr = useUI((s) => s.rdr);
  const say = useUI((s) => s.say);
  const items = useCart((s) => s.items);
  const chg = useCart((s) => s.chg);
  const removed = useCart((s) => s.removed);
  const restore = useCart((s) => s.restore);
  const purge = useCart((s) => s.purgeRemoved);
  const go = useRoute((s) => s.go);
  const free = useData((s) => s.settings.free);

  /* keyboard: Esc closes the drawer */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dr(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dr]);

  const t = cartTotal(items);

  return (
    <aside className={"dr" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="سبد خرید">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>سبد خرید</b>
        <button className="btn ghost" type="button" onClick={() => dr(false)}>
          ✕
        </button>
      </div>
      <div>
        {items.length === 0
          ? <p>سبد خالی است.</p>
          : items.map((x) => {
              const p = findProduct(x.id);
              if (!p) return null;
              return (
                <div className="ci" key={x.id}>
                  <span>
                    {p.e} {p.n}
                    <br />
                    <small>
                      {F(x.n)} × {F(p.p)}
                    </small>
                  </span>
                  <span>
                    <button className="btn ghost" type="button" onClick={() => chg(x.id, 1)}>
                      +
                    </button>{" "}
                    <button
                      className="btn ghost"
                      type="button"
                      title="کاهش / حذف از سبد"
                      onClick={() => {
                        if (x.n <= 1) say("از سبد حذف شد — در «لیست کالای حذف‌شده» ماند 🗑");
                        chg(x.id, -1);
                      }}
                    >
                      −
                    </button>
                  </span>
                </div>
              );
            })}
      </div>
      <div id="tot" style={{ margin: "14px 0", fontWeight: 800 }}>
        جمع: {F(t)} تومان
        {t > 0 && (
          <>
            <div className="prog">
              <i style={{ width: `${Math.min(100, (t / free) * 100)}%` }} />
            </div>
            <small className="ok">
              {t >= free ? "ارسال شما رایگان است 🎉" : `${F(free - t)} تومان تا ارسال رایگان`}
            </small>
          </>
        )}
      </div>
      {/* بخش «لیست کالای حذف‌شده» داخل سبد — با همان آیکن قرمز (دستور ۲۷) */}
      <div className="rmsec">
        <div className="rmh">
          🗑️ لیست کالای حذف‌شده
          {removed.length > 0 && (
            <button
              className="btn ghost"
              style={{ marginInlineStart: "auto", padding: "2px 8px", fontSize: 12 }}
              type="button"
              onClick={() => {
                dr(false);
                rdr(true);
              }}
            >
              نمای کامل
            </button>
          )}
        </div>
        {removed.length === 0 ? (
          <small style={{ color: "var(--mute)" }}>چیزی حذف نشده است؛ کالایی که از سبد کم کنید اینجا می‌ماند.</small>
        ) : (
          removed.map((x) => {
            const p = findProduct(x.id);
            return (
              <div className="ci" key={x.id}>
                <span>
                  {p ? (
                    <>
                      {p.e} {p.n}
                    </>
                  ) : (
                    "کالای حذف‌شده از فروشگاه"
                  )}
                  <br />
                  <small>
                    {F(x.n)} × {F(p?.p ?? 0)}
                  </small>
                </span>
                <span>
                  <button className="btn ghost" type="button" onClick={() => { restore(x.id); say("به سبد بازگشت ✓"); }} title="بازگرداندن به سبد">
                    ↩ بازگرداندن
                  </button>{" "}
                  <button className="btn ghost" type="button" onClick={() => purge(x.id)} title="حذف از این لیست">
                    ✕
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
      <button className="btn" style={{ width: "100%" }} type="button" onClick={() => { dr(false); go("checkout", { q: "" }); }}>
        ادامه و پرداخت امن
      </button>
    </aside>
  );
}

export function CartBadge({ mobile = false }: { mobile?: boolean }) {
  const items = useCart((s) => s.items);
  void mobile;
  return <b>{F(cartCount(items))}</b>;
}

/** کشوی «لیست کالای حذف‌شده» — با آیکن قرمز هدر/نوار پایین باز می‌شود (دستور ۲۷) */
export function RemovedDrawer() {
  const open = useUI((s) => s.rdrw);
  const rdr = useUI((s) => s.rdr);
  const say = useUI((s) => s.say);
  const removed = useCart((s) => s.removed);
  const restore = useCart((s) => s.restore);
  const purge = useCart((s) => s.purgeRemoved);
  const clearRemoved = useCart((s) => s.clearRemoved);

  /* keyboard: Esc closes the drawer */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") rdr(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rdr]);

  return (
    <aside className={"dr" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="لیست کالای حذف‌شده">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b className="rmh" style={{ margin: 0, padding: 0, border: 0 }}>
          🗑️ لیست کالای حذف‌شده
        </b>
        <button className="btn ghost" type="button" onClick={() => rdr(false)}>
          ✕
        </button>
      </div>
      {removed.length === 0 ? (
        <p>کالایی از سبد حذف نشده است. با کم‌کردن تعداد هر کالا تا صفر، همین‌جا نگه داشته می‌شود.</p>
      ) : (
        <>
          <div>
            {removed.map((x) => {
              const p = findProduct(x.id);
              return (
                <div className="ci" key={x.id}>
                  <span>
                    {p ? (
                      <>
                        {p.e} {p.n}
                      </>
                    ) : (
                      "کالای حذف‌شده از فروشگاه"
                    )}
                    <br />
                    <small>
                      {F(x.n)} × {F(p?.p ?? 0)}
                    </small>
                  </span>
                  <span>
                    <button className="btn ghost" type="button" onClick={() => { restore(x.id); say("به سبد بازگشت ✓"); }} title="بازگرداندن به سبد">
                      ↩ بازگرداندن
                    </button>{" "}
                    <button className="btn ghost" type="button" onClick={() => purge(x.id)} title="حذف از این لیست">
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
          <button
            className="btn ghost"
            style={{ width: "100%", marginTop: 12 }}
            type="button"
            onClick={() => {
              clearRemoved();
              say("لیست حذف‌شده‌ها پاک شد");
            }}
          >
            پاک کردن کل لیست
          </button>
        </>
      )}
    </aside>
  );
}
