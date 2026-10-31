"use client";

import { C } from "@/data/store";
import { F } from "@/lib/format";
import { useData, useRoute } from "@/lib/shop-state";
import { Crumb } from "../bits-helper";

export function CatsView() {
  const go = useRoute((s) => s.go);
  const prods = useData((s) => s.prods);
  return (
    <>
      <Crumb parts={["دسته‌بندی‌ها"]} />
      <div className="w">
        <h2>همه دسته‌بندی‌ها</h2>
        <div className="rv">
          {C.map(([e, n]) => (
            <a key={n} className="panel" href="#shop" onClick={() => go("shop", { cat: n, q: "" })}>
              <span style={{ fontSize: 40 }}>{e}</span>
              <br />
              <b>{n}</b>
              <br />
              <small style={{ color: "var(--mute)" }}>{F(prods.filter((p) => p.c === n).length)} محصول</small>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
