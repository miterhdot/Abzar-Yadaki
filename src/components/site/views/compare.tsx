"use client";

import { Fit, fitMatch, Product } from "@/data/store";
import { useCompare, useData, useRoute, useUI } from "@/lib/shop-state";
import { F, normFa } from "@/lib/format";
import { useAddToCart } from "../bits";
import { Crumb } from "../bits-helper";

/* دستور ۴۲ (M1): متن خوانای سازگاری از ردیف‌های Fit */
function fitText(f?: Fit[]): string {
  if (!f || f.length === 0) return "—";
  if (f.every((x) => x.m === "*")) return "همهٔ خودروها";
  return f.map((x) => `${x.b ? `${x.b} ` : ""}${x.m} · ${F(x.y0)} تا ${F(x.y1)}`).join(" / ");
}

/** مقایسه محصولات — دستور ۴۲ (M1، پیشنهاد ۳): تا ۴ قطعه کنار هم */
export function CompareView() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const prods = useData((s) => s.prods);
  const fit = useRoute((s) => s.fit);
  const say = useUI((s) => s.say);
  const onAdd = useAddToCart();

  const list = ids.map((id) => prods.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));
  /* فیلتر خودروی فعال کاربر (دستور ۴۰) — در مقایسه هم به کار می‌رود */
  const [fb = "", fm = "", fy = ""] = fit.split("|");
  const yNum = fy ? Number(normFa(fy)) || 0 : 0;
  const hasCar = Boolean(fb || fm || fy);
  const minP = list.length ? Math.min(...list.map((p) => p.p)) : 0;

  return (
    <>
      <Crumb parts={["مقایسه محصولات"]} />
      <div className="w">
        <h2>
          مقایسه محصولات{" "}
          {list.length > 0 && (
            <small style={{ color: "var(--mute)", fontSize: 13 }}>
              {F(list.length)} از حداکثر {F(4)} قطعه
            </small>
          )}
        </h2>
        {list.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "30px 16px" }}>
            <div style={{ fontSize: 44 }}>⚖️</div>
            <b>هنوز کالایی برای مقایسه انتخاب نکرده‌اید</b>
            <p style={{ color: "var(--mute)" }}>روی دکمهٔ ⚖️ هر محصول در فروشگاه بزنید تا اینجا کنار هم مقایسه شوند.</p>
            <a className="btn" href="#shop">
              رفتن به فروشگاه
            </a>
          </div>
        ) : (
          <>
            <div className="panel" style={{ overflowX: "auto", padding: 0 }}>
              <table className="cmp">
                <thead>
                  <tr>
                    <th>ویژگی</th>
                    {list.map((p) => (
                      <th key={p.id}>
                        <a href={`#p-${p.id}`} style={{ display: "block", fontSize: 22, textDecoration: "none" }}>
                          {p.e}
                        </a>
                        <a href={`#p-${p.id}`}>{p.n}</a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>برند</td>
                    {list.map((p) => (
                      <td key={p.id}>{p.b}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>قیمت</td>
                    {list.map((p) => (
                      <td key={p.id}>
                        {p.o ? <s style={{ color: "var(--mute)", fontSize: 12 }}>{F(p.o)}</s> : null}{" "}
                        <b>{F(p.p)}</b> تومان
                        {p.p === minP && list.length > 1 && <span className="best">ارزان‌ترین ✓</span>}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>موجودی</td>
                    {list.map((p) => (
                      <td key={p.id}>{p.s ? "موجود · ارسال امروز" : "موجود در انبار"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>امتیاز</td>
                    {list.map((p) => (
                      <td key={p.id}>⭐ {p.r}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>سازگاری با خودرو</td>
                    {list.map((p) => (
                      <td key={p.id}>{fitText(p.f)}</td>
                    ))}
                  </tr>
                  {hasCar && (
                    <tr>
                      <td>سازگار با خودروی شما؟</td>
                      {list.map((p) =>
                        fitMatch(p, fb, fm, yNum) ? (
                          <td key={p.id} className="ok">
                            ✔ سازگار
                          </td>
                        ) : (
                          <td key={p.id} style={{ color: "var(--mute)" }}>
                            ✕ سازگار نیست
                          </td>
                        )
                      )}
                    </tr>
                  )}
                  <tr>
                    <td>اقدام</td>
                    {list.map((p) => (
                      <td key={p.id}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                          <button className="btn" type="button" onClick={() => onAdd(p.id)}>
                            افزودن به سبد
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            aria-label={`حذف ${p.n} از مقایسه`}
                            onClick={() => {
                              remove(p.id);
                              say("از مقایسه حذف شد");
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  clear();
                  say("فهرست مقایسه پاک شد");
                }}
              >
                پاک کردن همه
              </button>
              <a className="btn ghost" href="#shop">
                ادامهٔ خرید
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}
