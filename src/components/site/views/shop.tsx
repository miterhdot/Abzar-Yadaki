"use client";

import { C } from "@/data/store";
import { useData, useRoute } from "@/lib/shop-state";
import { normFa } from "@/lib/format";
import { ProductCard } from "../bits";

export function ShopView() {
  const cat = useRoute((s) => s.cat);
  const q = useRoute((s) => s.q);
  const sort = useRoute((s) => s.sort);
  const setSort = useRoute((s) => s.setSort);
  const go = useRoute((s) => s.go);
  const prods = useData((s) => s.prods);

  /* دستور ۲۹: جستجو شامل نام و برند (جای جستجو می‌گوید «نام قطعه، کد فنی یا خودرو») */
  /* دستور ۳۲ (A1): جستجوی فارسی نرمال‌شده — ي/ی، ك/ک، ارقام، نیم‌فاصله */
  const nq = normFa(q);
  let list = prods.filter((p) => (!cat || p.c === cat) && (!nq || normFa(p.n).includes(nq) || normFa(p.b).includes(nq)));
  if (sort === "a") list = [...list].sort((a, b) => a.p - b.p);
  if (sort === "d") list = [...list].sort((a, b) => b.p - a.p);

  return (
    <div className="w">
      <h2>فروشگاه{cat ? ` · ${cat}` : ""}</h2>
      <div className="bar">
        <button type="button" className={cat ? "" : "on"} onClick={() => go("shop", { cat: "" })}>
          همه
        </button>
        {C.map(([, c]) => (
          <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => go("shop", { cat: c })}>
            {c}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="مرتب‌سازی">
          <option value="">مرتب‌سازی</option>
          <option value="a">ارزان‌ترین</option>
          <option value="d">گران‌ترین</option>
        </select>
      </div>
      <div className="grid">
        {list.length ? list.map((p) => <ProductCard key={p.id} p={p} />) : <p>محصولی یافت نشد.</p>}
      </div>
    </div>
  );
}
