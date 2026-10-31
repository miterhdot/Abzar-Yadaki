"use client";

import { C, P } from "@/data/store";
import { useRoute } from "@/lib/shop-state";
import { ProductCard } from "../bits";

export function ShopView() {
  const cat = useRoute((s) => s.cat);
  const q = useRoute((s) => s.q);
  const sort = useRoute((s) => s.sort);
  const setSort = useRoute((s) => s.setSort);
  const go = useRoute((s) => s.go);

  let list = P.filter((p) => (!cat || p.c === cat) && (!q || p.n.includes(q)));
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
