"use client";

import { useEffect } from "react";
import { F } from "@/lib/format";
import { cartCount, cartTotal, findProduct, useCart, useData, useRoute, useUI } from "@/lib/shop-state";

/** Cart drawer — 1:1 from design (side panel on desktop, bottom sheet on mobile)
 *  دستور ۲۸: بخش «لیست کالای حذف‌شده» از داخل سبد حذف شد؛ حذف کالا → کشوی «لیست انتظار» خودکار باز می‌شود */
export function CartDrawer() {
  const open = useUI((s) => s.drawer);
  const dr = useUI((s) => s.dr);
  const rdr = useUI((s) => s.rdr);
  const say = useUI((s) => s.say);
  const items = useCart((s) => s.items);
  const chg = useCart((s) => s.chg);
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
                        if (x.n <= 1) {
                          say("به «لیست انتظار» منتقل شد ⏳");
                          dr(false);
                          rdr(true); /* به محض حذف، لیست انتظار نشان داده می‌شود (دستور ۲۸) */
                        }
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

/** کشوی «لیست انتظار» — دو دسته: «حذف‌شده از سبد» (بالاتر) + «در حال بررسی» (دستور ۲۸) */
export function WaitingDrawer() {
  const open = useUI((s) => s.rdrw);
  const rdr = useUI((s) => s.rdr);
  const say = useUI((s) => s.say);
  const removed = useCart((s) => s.removed);
  const restore = useCart((s) => s.restore);
  const purge = useCart((s) => s.purgeRemoved);
  const clearRemoved = useCart((s) => s.clearRemoved);
  const saved = useCart((s) => s.saved);
  const unsave = useCart((s) => s.unsave);
  const clearSaved = useCart((s) => s.clearSaved);
  const add = useCart((s) => s.add);

  /* keyboard: Esc closes the drawer */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") rdr(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rdr]);

  const empty = removed.length === 0 && saved.length === 0;

  return (
    <aside className={"dr" + (open ? " open" : "")} role="dialog" aria-modal="true" aria-label="لیست انتظار">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b className="rmh" style={{ margin: 0, padding: 0, border: 0 }}>
          ⏳ لیست انتظار
        </b>
        <button className="btn ghost" type="button" onClick={() => rdr(false)}>
          ✕
        </button>
      </div>
      {empty ? (
        <p>
          لیست انتظار خالی است.
          <br />
          <small style={{ color: "var(--mute)" }}>
            کالایی که از سبد حذف کنید یا از صفحه با «⏳ ذخیره در لیست انتظار» علامت بزنید، همین‌جا نگه داشته می‌شود.
          </small>
        </p>
      ) : (
        <>
          {/* ── دستهٔ ۱ (بالاتر): حذف‌شده از سبد ── */}
          <div className="rmsec">
            <div className="rmh">
              🛒 حذف‌شده از سبد
              {removed.length > 0 && (
                <button
                  className="btn ghost"
                  style={{ marginInlineStart: "auto", padding: "2px 8px", fontSize: 12 }}
                  type="button"
                  onClick={() => {
                    clearRemoved();
                    say("حذف‌شده‌ها پاک شد");
                  }}
                >
                  پاک کردن
                </button>
              )}
            </div>
            {removed.length === 0 ? (
              <small style={{ color: "var(--mute)" }}>چیزی از سبد حذف نشده است.</small>
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

          {/* ── دستهٔ ۲: در حال بررسی (کالای انتخاب‌شده با شک) ── */}
          <div className="rmsec">
            <div className="svh">
              🤔 در حال بررسی
              {saved.length > 0 && (
                <button
                  className="btn ghost"
                  style={{ marginInlineStart: "auto", padding: "2px 8px", fontSize: 12 }}
                  type="button"
                  onClick={() => {
                    clearSaved();
                    say("«در حال بررسی» پاک شد");
                  }}
                >
                  پاک کردن
                </button>
              )}
            </div>
            {saved.length === 0 ? (
              <small style={{ color: "var(--mute)" }}>
                کالایی که روی آن شک دارید را در صفحهٔ محصول با «⏳ ذخیره در لیست انتظار» اینجا بیاورید.
              </small>
            ) : (
              saved.map((x) => {
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
                      <small>{F(p?.p ?? 0)} تومان</small>
                    </span>
                    <span>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => { add(x.id, 1); say("به سبد اضافه شد ✓"); }}
                        title="افزودن به سبد"
                      >
                        + افزودن به سبد
                      </button>{" "}
                      <button className="btn ghost" type="button" onClick={() => unsave(x.id)} title="حذف از این لیست">
                        ✕
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </aside>
  );
}
