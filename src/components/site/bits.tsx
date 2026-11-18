"use client";

import { Product } from "@/data/store";
import { F } from "@/lib/format";
import { useCart, useCompare, useUI, useWish } from "@/lib/shop-state";

/** The exact hexagon logo mark from the design */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#143a66" />
      <rect x=".75" y=".75" width="46.5" height="46.5" rx="12.5" fill="none" stroke="#3b78c0" strokeWidth="1.5" />
      <polygon points="24,7 38.5,15.5 38.5,32.5 24,41 9.5,32.5 9.5,15.5" fill="#0b1f3a" />
      <polygon
        points="24,12.5 33.8,18.2 33.8,29.8 24,35.5 14.2,29.8 14.2,18.2"
        fill="none"
        stroke="#ffb703"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="5.5" fill="#ffb703" />
      <circle cx="24" cy="24" r="2.2" fill="#0b1f3a" />
    </svg>
  );
}

/** `pn()` helper of the design — small info panel */
export function Pn({ t, d }: { t: React.ReactNode; d: string }) {
  return (
    <div className="panel">
      <b>{t}</b>
      <br />
      <small style={{ color: "var(--mute)" }}>{d}</small>
    </div>
  );
}

/** add(id) + toast — دستور ۲۸: سبد دیگر به‌صورت خودکار باز نمی‌شود؛
 *  «به صورت معمول سبد را نباید نمایش بدهی به محض اینکه کالایی را حذف کرد یا از صفحه‌ای کالایی را انتخاب کرد» */
export function useAddToCart() {
  const add = useCart((s) => s.add);
  return (id: number, n = 1) => {
    add(id, n);
    useUI.getState().say("به سبد اضافه شد ✓");
  };
}

/** ذخیره/برداشتن کالا در دستهٔ «در حال بررسی» لیست انتظار — با ذخیره، لیست خودکار باز می‌شود (دستور ۲۸) */
export function useWaiting() {
  const saved = useCart((s) => s.saved);
  const save = useCart((s) => s.save);
  const unsave = useCart((s) => s.unsave);
  const rdr = useUI((s) => s.rdr);
  return {
    savedIds: saved.map((x) => x.id),
    toggle: (id: number) => {
      const on = saved.some((x) => x.id === id);
      if (on) {
        unsave(id);
        useUI.getState().say("از لیست انتظار حذف شد");
      } else {
        save(id);
        rdr(true); /* به محض انتخاب، لیست انتظار نشان داده می‌شود (دستور ۲۸) */
        useUI.getState().say("در «لیست انتظار» ذخیره شد ⏳");
      }
      return !on;
    },
  };
}

/** قلب علاقه‌مندی — با کلاس .fav (همان زبان طراحی) */
export function FavBtn({ id }: { id: number }) {
  const ids = useWish((s) => s.ids);
  const toggle = useWish((s) => s.toggle);
  const on = ids.includes(id);
  return (
    <button
      type="button"
      aria-label={on ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-pressed={on}
      className={"fav" + (on ? " on" : "")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = toggle(id);
        useUI.getState().say(now ? "به علاقه‌مندی‌ها اضافه شد ❤️" : "از علاقه‌مندی‌ها حذف شد");
      }}
    >
      {on ? "❤️" : "🤍"}
    </button>
  );
}

/** دکمهٔ مقایسه — دستور ۴۲ (M1): حداکثر ۴ قطعه؛ icon=کارت محصول، block=صفحهٔ محصول */
export function CompareBtn({ id, icon, block }: { id: number; icon?: boolean; block?: boolean }) {
  const ids = useCompare((s) => s.ids);
  const toggle = useCompare((s) => s.toggle);
  const on = ids.includes(id);
  const label = on ? "حذف از مقایسه" : "افزودن به مقایسه";
  return (
    <button
      type="button"
      className={"btn ghost" + (on ? " on" : "")}
      style={block ? { width: "100%", padding: 11, marginTop: 8 } : { padding: "6px 10px" }}
      aria-label={label}
      aria-pressed={on}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!on && ids.length >= 4) {
          useUI.getState().say("حداکثر ۴ قطعه قابل مقایسه است ⚖️");
          return;
        }
        const now = toggle(id);
        useUI.getState().say(now ? "به مقایسه اضافه شد ⚖️" : "از مقایسه حذف شد");
      }}
    >
      {icon ? (on ? "✓" : "⚖️") : on ? "✓ در مقایسه است" : "⚖ مقایسه"}
    </button>
  );
}

/** نوار شناور مقایسه — دستور ۴۲ (M1): نمایان وقتی حداقل یک قطعه انتخاب شده */
export function CompareBar() {
  const n = useCompare((s) => s.ids.length);
  if (n === 0) return null;
  return (
    <div className="cmpbar">
      <span>⚖ {F(n)} قطعه برای مقایسه</span>
      <a className="btn" href="#compare">
        مقایسه
      </a>
      <button
        type="button"
        aria-label="پاک کردن فهرست مقایسه"
        onClick={() => {
          useCompare.getState().clear();
          useUI.getState().say("فهرست مقایسه پاک شد");
        }}
      >
        ✕
      </button>
    </div>
  );
}

/** Product card — 1:1 from design's card() */
export function ProductCard({ p }: { p: Product }) {
  const onAdd = useAddToCart();
  const wt = useWaiting();
  const inWait = wt.savedIds.includes(p.id);
  return (
    <div className="pc">
      <a href={`#p-${p.id}`} className="pi">
        <FavBtn id={p.id} />
        {p.o ? <i>٪{F(Math.round(100 - (p.p / p.o) * 100))}</i> : null}
        {p.e}
      </a>
      <div className="pb">
        <small>
          {p.b} · ⭐ {p.r}
        </small>
        <h3>
          <a href={`#p-${p.id}`}>{p.n}</a>
        </h3>
        <small className="ok">{p.s ? "موجود · ارسال امروز" : "موجود در انبار"}</small>
        <div className="pr">
          <div>
            {p.o ? <s>{F(p.o)}</s> : null}
            <b>{F(p.p)}</b> <small>تومان</small>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={"btn ghost" + (inWait ? " on" : "")}
              type="button"
              aria-label={inWait ? "حذف از لیست انتظار" : "ذخیره در لیست انتظار"}
              aria-pressed={inWait}
              title={inWait ? "حذف از لیست انتظار" : "ذخیره در لیست انتظار"}
              style={{ padding: "6px 10px" }}
              onClick={() => wt.toggle(p.id)}
            >
              {inWait ? "✓" : "⏳"}
            </button>
            <CompareBtn id={p.id} icon />
            <button className="btn" type="button" onClick={() => onAdd(p.id)}>
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
