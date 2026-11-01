"use client";

import { useEffect } from "react";
import { F } from "@/lib/format";
import { cartCount, cartTotal, findProduct, useCart, useData, useRoute, useUI } from "@/lib/shop-state";

/** Cart drawer — 1:1 from design (side panel on desktop, bottom sheet on mobile) */
export function CartDrawer() {
  const open = useUI((s) => s.drawer);
  const dr = useUI((s) => s.dr);
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
                    <button className="btn ghost" type="button" onClick={() => chg(x.id, -1)}>
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
