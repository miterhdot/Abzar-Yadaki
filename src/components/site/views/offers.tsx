"use client";

import { useEffect, useState } from "react";
import { P } from "@/data/store";
import { pd } from "@/lib/format";
import { ProductCard } from "../bits";
import { Crumb } from "../bits-helper";

function Countdown() {
  const [t, setT] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const end = new Date(n);
      end.setHours(24, 0, 0, 0);
      const s = Math.floor((end.getTime() - n.getTime()) / 1000);
      setT([Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <span className="cd" id="cd">
      {t ? (
        <>
          <span>{pd(t[0])}</span>:<span>{pd(t[1])}</span>:<span>{pd(t[2])}</span>
        </>
      ) : null}
    </span>
  );
}

export function OffersView() {
  return (
    <>
      <Crumb parts={["تخفیف‌ها"]} />
      <div className="w">
        <h2>
          تخفیف‌های ویژه <Countdown />
        </h2>
        <div className="grid">
          {P.filter((p) => p.o).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </>
  );
}
