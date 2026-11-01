"use client";

import { useData, useWish } from "@/lib/shop-state";
import { F } from "@/lib/format";
import { ProductCard } from "../bits";
import { Crumb } from "../bits-helper";

/** علاقه‌مندی‌ها */
export function WishlistView() {
  const ids = useWish((s) => s.ids);
  const prods = useData((s) => s.prods);
  const list = ids.map((id) => prods.find((p) => p.id === id)).filter(Boolean);

  return (
    <>
      <Crumb parts={["علاقه‌مندی‌ها"]} />
      <div className="w">
        <h2>علاقه‌مندی‌های من {ids.length > 0 && <small style={{ color: "var(--mute)", fontSize: 13 }}>{F(ids.length)} کالا</small>}</h2>
        {list.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "30px 16px" }}>
            <div style={{ fontSize: 44 }}>🤍</div>
            <b>هنوز کالایی به علاقه‌مندی‌ها اضافه نکرده‌اید</b>
            <p style={{ color: "var(--mute)" }}>روی قلب هر محصول بزنید تا اینجا ذخیره شود.</p>
            <a className="btn" href="#shop">
              رفتن به فروشگاه
            </a>
          </div>
        ) : (
          <div className="grid">
            {list.map((p) => p && <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
