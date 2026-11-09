"use client";

/* ═══════════════════════════════════════════════════════════════════
   اپلیکیشن موبایل «ابزار یدکی» — پرت ۱:۱ گرافیک مدیر (دستور ۱۵)
   سیم‌کشی: محصولات/تنظیمات از useData، سبد از useCart،
   علاقه‌مندی از useWish، تسویه‌حساب به جریان واقعی #checkout.
   کد اپ کاملاً از نسخه وب جدا است (قانون ۱)؛ نقطه اتصال واحد: site-app.tsx
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Product } from "@/data/store";
import { C } from "@/data/store";
import { F, pd } from "@/lib/format";
import { cartCount, cartTotal, findProduct, useCart, useData, useRoute, useWish } from "@/lib/shop-state";
import { AiIcon, CK, Ci, LogoM, PIcon, TabCart, TabCats, TabHome, TabMe, TabWait, WaIcon } from "./icons";
import "./app.css";

/* خودروهای شیت انتخاب خودرو — عیناً از فایل طراحی */
const CARS = ["پژو ۲۰۶", "پژو ۴۰۵", "سمند", "پراید", "تیبا", "دنا"];

/* پیام جایگزین دستیار — عیناً از فایل طراحی */
const AI_FALLBACK = "دستیار هوشمند فعلاً در دسترس نیست؛ از دسته‌ها یا جستجو استفاده کن.";

type MView = { k: "home" | "cats" | "cart" | "me" } | { k: "prod"; id: number };

/** مسیرهای اپ: هم مسیرهای اختصاصی #app-* و هم نگاشت مسیرهای وب روی موبایل */
export function mRouteFromHash(h: string): MView {
  const x = (h || "").replace(/^#/, "");
  if (x.startsWith("app-p-")) return { k: "prod", id: Number(x.slice(6)) || 0 };
  if (x.startsWith("p-")) return { k: "prod", id: Number(x.slice(2)) || 0 };
  if (x === "cats" || x === "app-cats" || x === "shop") return { k: "cats" };
  if (x === "cart" || x === "app-cart") return { k: "cart" };
  if (x === "app-me") return { k: "me" };
  return { k: "home" }; // "" ، #home ، #app و هر مسیر ناشناخته
}

const go = (h: string) => {
  window.location.hash = h;
};

export default function MobileApp() {
  /* مسیر — هم‌سو با روتر نسخهٔ وب (useSyncExternalStore، بدون setState داخل افکت — دستور ۲۹) */
  const hash = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash,
    () => ""
  );
  /* شمارش ناوبری درون‌اپ (دستور ۲۹): اگر کاربر مستقیم با لینک محصول وارد شده باشد،
     دکمهٔ بازگشت به‌جای خروج از سایت، به دسته‌ها برمی‌گردد */
  const navRef = useRef(0);
  const goBack = () => {
    if (navRef.current > 0) history.back();
    else go("#app-cats");
  };
  useEffect(() => {
    const on = () => {
      navRef.current += 1;
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const view = mRouteFromHash(hash);

  /* ── وضعیت اپ (مطابق متغیرهای طراحی: cat, q, car) ── */
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [car, setCar] = useState("");
  const [sheet, setSheet] = useState<null | "car" | "ai" | "rm">(null);

  /* ── توست اپ (مطابق toast طراحی — ۱۸۰۰ms) ── */
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const say = (m: string) => {
    setToast(m);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1800);
  };

  /* ── استورهای واقعی فروشگاه (سیم‌کشی) ── */
  const prods = useData((s) => s.prods);
  const free = useData((s) => s.settings.free);
  const shipPost = useData((s) => s.settings.shipPost);
  const items = useCart((s) => s.items);
  const cartAdd = useCart((s) => s.add);
  const cartChg = useCart((s) => s.chg);
  const removedItems = useCart((s) => s.removed);
  const cartRestore = useCart((s) => s.restore);
  const cartPurge = useCart((s) => s.purgeRemoved);
  const cartClearRemoved = useCart((s) => s.clearRemoved);
  /* لیست انتظار — دستهٔ «در حال بررسی» (دستور ۲۸) */
  const savedItems = useCart((s) => s.saved);
  const cartSave = useCart((s) => s.save);
  const cartUnsave = useCart((s) => s.unsave);
  const cartClearSaved = useCart((s) => s.clearSaved);
  const wishIds = useWish((s) => s.ids);
  const wishToggle = useWish((s) => s.toggle);
  const webQ = useRoute((s) => s.q);
  const cnt = cartCount(items);
  const tot = cartTotal(items);
  const waitTotal = removedItems.length + savedItems.length; /* شمارندهٔ کل لیست انتظار */

  const add = (id: number) => {
    cartAdd(id);
    say("به سبد اضافه شد ✓");
  };

  /* ذخیره/برداشتن کالا در «لیست انتظار» — با ذخیره، شیت لیست باز می‌شود (دستور ۲۸) */
  const toggleWait = (id: number) => {
    if (savedItems.some((x) => x.id === id)) {
      cartUnsave(id);
      say("از لیست انتظار حذف شد");
    } else {
      cartSave(id);
      setSheet("rm");
      say("در «لیست انتظار» ذخیره شد ⏳");
    }
  };

  /* ── سوار/پیاده‌سازی: کلاس بدنه + عنوان سند (مطابق <title> طراحی) ── */
  useEffect(() => {
    document.body.classList.add("mapp-on");
    const prev = document.title;
    document.title = "ابزار یدکی | اپلیکیشن";
    return () => {
      document.body.classList.remove("mapp-on");
      document.title = prev;
    };
  }, []);

  /* رفتن به بالای صفحه با هر تغییر مسیر — مثل روتر نسخه وب */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hash]);

  /* بستن شیت با Esc — دنباله دستور ۱۴ (دقت کیبورد) */
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  /* ── شمارش معکوس تا نیمه‌شب (مطابق setInterval طراحی) ── */
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const t = new Date(n);
      t.setHours(24, 0, 0, 0);
      setSec(Math.max(0, Math.floor((t.getTime() - n.getTime()) / 1e3)));
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => window.clearInterval(iv);
  }, []);

  /* ── دستیار هوش مصنوعی (سیم‌کشی به /api/ai-chat با کاتالوگ واقعی) ── */
  type AiMsg = { role: "u" | "a"; t: string };
  const [aiHist, setAiHist] = useState<AiMsg[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const mlRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const m = mlRef.current;
    if (m) m.scrollTop = m.scrollHeight;
  }, [aiHist]);

  const aiOpen = () => {
    if (!aiHist.length)
      setAiHist([
        {
          role: "a",
          t: "سلام! بگو چه کاری روی خودرو داری (مثلاً «سرویس دوره‌ای پراید») تا بهترین قطعه‌ها را پیشنهاد بدهم.",
        },
      ]);
    setSheet("ai");
  };

  const aiSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget.elements.namedItem("t") as HTMLInputElement | null;
    const t = (el?.value ?? "").trim();
    if (!t || aiBusy) return;
    if (el) el.value = "";
    const base: AiMsg[] = [...aiHist, { role: "u", t }];
    setAiHist([...base, { role: "a", t: "در حال فکر کردن..." }]);
    setAiBusy(true);
    let r = AI_FALLBACK;
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car,
          catalog: prods.map((p) => ({ id: p.id, n: p.n, c: p.c, p: p.p })),
          messages: base.map((m) => ({ role: m.role === "u" ? "user" : "assistant", content: m.t })),
        }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j?.text) r = String(j.text);
      }
    } catch {
      /* fallback می‌ماند */
    }
    setAiHist([...base, { role: "a", t: r }]);
    setAiBusy(false);
  };

  /* رندر پیام دستیار: حذف نشانه‌های [[شناسه]] + کارت محصول (مطابق aiDraw طراحی) */
  const aiDraw = (t: string) => {
    const cards = [...t.matchAll(/\[\[(\d+)\]\]/g)]
      .map((m) => prods.find((p) => String(p.id) === m[1]))
      .filter((x): x is Product => Boolean(x));
    const text = t.replace(/\[\[\d+\]\]/g, "").trim();
    return (
      <>
        {text}
        {cards.map((p) => (
          <div className="mmc" key={p.id}>
            <span>
              {p.n}
              <br />
              <b>{F(p.p)} تومان</b>
            </span>
            <button type="button" onClick={() => add(p.id)}>
              افزودن
            </button>
          </div>
        ))}
      </>
    );
  };

  /* ── اجزای مشترک ── */

  const logo = () => (
    <div className="mlg">
      <LogoM />
      <div>
        <b>
          ابزار<i>یدکی</i>
        </b>
        <small>Abzaryadaki.com</small>
      </div>
    </div>
  );

  const cartBtn = (extra?: string) => (
    <button type="button" className={"mib2" + (extra ? " " + extra : "")} onClick={() => go("#app-cart")} aria-label="سبد خرید">
      <TabCart />
      {cnt > 0 ? <b className="mcn">{F(cnt)}</b> : null}
    </button>
  );

  /* آیکون قرمز «لیست انتظار» کنار آیکون سبد — شیت دو دسته‌ای را باز می‌کند (دستور ۲۸) */
  const rmBtn = (extra?: string) => (
    <button
      type="button"
      className={"mib2 mrmb" + (extra ? " " + extra : "")}
      onClick={() => setSheet("rm")}
      aria-label="لیست انتظار"
    >
      <TabWait />
      {waitTotal > 0 ? <b className="mcn mcn-rm">{F(waitTotal)}</b> : null}
    </button>
  );

  const card = (p: Product) => {
    const wished = wishIds.includes(p.id);
    return (
      <div className="mpc" key={p.id} onClick={() => go(`#app-p-${p.id}`)}>
        <div className="mim">
          {p.o ? <i>٪{F(Math.round(100 - (p.p / p.o) * 100))}</i> : null}
          <button
            type="button"
            className={"mst" + (wished ? " on" : "")}
            aria-label="علاقه‌مندی"
            onClick={(e) => {
              e.stopPropagation();
              wishToggle(p.id);
            }}
          >
            {wished ? "★" : "☆"}
          </button>
          <PIcon p={p} />
        </div>
        <div className="mbd">
          <small>
            {p.b} · ⭐ {p.r}
          </small>
          <h3>{p.n}</h3>
          <div className="mpp">
            {p.o ? <s>{F(p.o)}</s> : null}
            <b>{F(p.p)}</b> <small>تومان</small>
          </div>
        </div>
        <button
          type="button"
          className="mad mwt"
          aria-label="ذخیره در لیست انتظار"
          onClick={(e) => {
            e.stopPropagation();
            toggleWait(p.id);
          }}
        >
          {savedItems.some((x) => x.id === p.id) ? "✓" : "⏳"}
        </button>
        <button
          type="button"
          className="mad"
          aria-label="افزودن به سبد"
          onClick={(e) => {
            e.stopPropagation();
            add(p.id);
          }}
        >
          +
        </button>
      </div>
    );
  };

  /* ── نماها (مطابق V طراحی) ── */

  /* home */
  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const el = e.currentTarget.elements.namedItem("q") as HTMLInputElement | null;
    setQ((el?.value ?? "").trim());
    go("#app-cats");
  };

  const homeView = (
    <>
      <div className="mtop">
        <div className="mrow">
          {logo()}
          <div className="mrg">
            <a className="mwa" href="https://wa.me/989120000000" target="_blank" rel="noopener">
              <i>
                <WaIcon />
              </i>
              <span>۰۹۱۲ ۰۰۰ ۰۰۰۰</span>
            </a>
            {cartBtn()}
            {rmBtn()}
          </div>
        </div>
        <form className="msrch" onSubmit={onSearch}>
          🔍<input name="q" placeholder="جستجوی قطعه، کد فنی یا ابزار" />
        </form>
      </div>

      <div
        className="mcar"
        role="button"
        tabIndex={0}
        onClick={() => setSheet("car")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setSheet("car");
        }}
      >
        <div className="mic">
          <Ci k="c" s={24} />
        </div>
        <div>
          <small>قطعات سازگار با</small>
          <b>{car || "خودروی خود را انتخاب کنید"}</b>
        </div>
        <span className="mch">{car ? "تغییر" : "انتخاب ‹"}</span>
      </div>

      <button className="mai" type="button" onClick={aiOpen}>
        <div className="mic">
          <AiIcon />
        </div>
        <div>
          <b>خرید با هوش مصنوعی</b>
          <small>بگو چه کاری روی خودرو داری؛ قطعه را پیدا می‌کنم</small>
        </div>
      </button>

      <div className="mhs" style={{ marginTop: 18 }}>
        {C.map(([, n]) => (
          <a
            key={n}
            className="mcc"
            href="#app-cats"
            onClick={() => setCat(n)}
          >
            <span>
              <Ci k={CK[n] ?? "t"} />
            </span>
            {n}
          </a>
        ))}
      </div>

      <div className="mhs" style={{ marginTop: 6 }}>
        <div className="mbn" style={{ background: "linear-gradient(135deg,#143a66,#0b1f3a)" }}>
          <b>روغن و فیلتر</b>
          <small>سرویس دوره‌ای با ضمانت اصالت</small>
          <span className="mgo">خرید کن</span>
        </div>
        <div className="mbn" style={{ background: "linear-gradient(135deg,#0f766e,#134e4a)" }}>
          <b>ارسال همان‌روز</b>
          <small>سفارش تا ساعت ۱۴ در تهران</small>
          <span className="mgo">جزئیات</span>
        </div>
        <div className="mbn" style={{ background: "linear-gradient(135deg,#7c5a00,#3f2e00)" }}>
          <b>ابزار حرفه‌ای</b>
          <small>ست آچار، جک و تجهیزات</small>
          <span className="mgo">مشاهده</span>
        </div>
      </div>

      <div className="msec">
        <span className="mrow">
          <b>تخفیف ویژه</b>
          <span className="mtm" id="mtm">
            <span>{pd(sec / 3600 | 0)}</span>
            <span>{pd((sec % 3600) / 60 | 0)}</span>
            <span>{pd(sec % 60 | 0)}</span>
          </span>
        </span>
        <a href="#app-cats">همه ‹</a>
      </div>
      <div className="mg">{prods.filter((p) => p.o).slice(0, 4).map((p) => card(p))}</div>

      <div className="msec">
        <b>پرفروش‌ها</b>
        <a href="#app-cats">همه ‹</a>
      </div>
      <div className="mg">{prods.slice(0, 4).map((p) => card(p))}</div>

      <div className="mtr">
        <div>
          <span>🛡️</span>ضمانت اصالت
        </div>
        <div>
          <span>🚚</span>ارسال سریع
        </div>
        <div>
          <span>↩️</span>۷ روز بازگشت
        </div>
      </div>

      <div className="msec">
        <b>پیشنهاد برای شما</b>
      </div>
      <div className="mg">{prods.slice(6, 12).map((p) => card(p))}</div>
    </>
  );

  /* cats — اگر از جستجوی نسخه وب (#shop) روی موبایل بیاید، عبارت جستجو حفظ می‌شود */
  const effQ = !q && hash.replace(/^#/, "") === "shop" ? webQ : q;
  /* دستور ۲۹: جستجو شامل نام و برند — هم‌سو با نسخهٔ وب */
  const list = prods.filter((p) => (!cat || p.c === cat) && (!effQ || p.n.includes(effQ) || p.b.includes(effQ)));
  const catsView = (
    <>
      <div className="mhd2">
        <b>{cat || "همه محصولات"}</b>
        <span style={{ marginInlineStart: "auto", color: "var(--mute)", fontSize: 13 }}>{F(list.length)} کالا</span>
        {cartBtn()}
        {rmBtn()}
      </div>
      <div className="mchips">
        <button
          type="button"
          className={cat ? "" : "on"}
          onClick={() => {
            setCat("");
            setQ("");
          }}
        >
          همه
        </button>
        {C.map(([, n]) => (
          <button key={n} type="button" className={cat === n ? "on" : ""} onClick={() => setCat(n)}>
            {n}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="mg">{list.map((p) => card(p))}</div>
      ) : (
        <div className="mem">
          <span>🔍</span>
          محصولی پیدا نشد
        </div>
      )}
    </>
  );

  /* ── دستهٔ ۱ لیست انتظار: حذف‌شده از سبد (دستور ۲۷) ── */
  const rmRows =
    removedItems.length === 0 ? (
      <small className="mrm-empty">چیزی از سبد حذف نشده است.</small>
    ) : (
      removedItems.map((x) => {
        const p = findProduct(x.id);
        return (
          <div className="mci" key={x.id} style={{ opacity: 0.88 }}>
            <div className="mim" style={{ display: "grid", placeItems: "center", fontSize: 26 }}>
              {p ? <PIcon p={p} s={30} /> : "🗑️"}
            </div>
            <div>
              <b>{p ? p.n : "کالای حذف‌شده از فروشگاه"}</b>
              {F(p?.p ?? 0)} تومان · تعداد: {F(x.n)}
            </div>
            <div className="mqt">
              <button type="button" aria-label="بازگرداندن به سبد" title="بازگرداندن به سبد" onClick={() => { cartRestore(x.id); say("به سبد بازگشت ✓"); }}>
                ↩
              </button>
              <button type="button" aria-label="حذف از لیست" title="حذف از لیست" onClick={() => cartPurge(x.id)}>
                ✕
              </button>
            </div>
          </div>
        );
      })
    );

  const rmClear =
    removedItems.length > 0 ? (
      <button
        className="mbt mnv"
        type="button"
        style={{ margin: "4px 16px 12px", width: "calc(100% - 32px)" }}
        onClick={() => {
          cartClearRemoved();
          say("لیست حذف‌شده‌ها پاک شد");
        }}
      >
        پاک کردن کل لیست
      </button>
    ) : null;

  /* ── دستهٔ ۲ لیست انتظار: در حال بررسی — کالای انتخاب‌شده با شک (دستور ۲۸) ── */
  const svRows =
    savedItems.length === 0 ? (
      <small className="mrm-empty">کالایی که روی آن شک دارید را در صفحهٔ محصول با «⏳» اینجا بیاورید.</small>
    ) : (
      savedItems.map((x) => {
        const p = findProduct(x.id);
        return (
          <div className="mci" key={x.id} style={{ opacity: 0.88 }}>
            <div className="mim" style={{ display: "grid", placeItems: "center", fontSize: 26 }}>
              {p ? <PIcon p={p} s={30} /> : "🤔"}
            </div>
            <div>
              <b>{p ? p.n : "کالای حذف‌شده از فروشگاه"}</b>
              {F(p?.p ?? 0)} تومان
            </div>
            <div className="mqt">
              <button
                type="button"
                aria-label="افزودن به سبد"
                title="افزودن به سبد"
                onClick={() => add(x.id)}
              >
                +
              </button>
              <button type="button" aria-label="حذف از لیست" title="حذف از لیست" onClick={() => cartUnsave(x.id)}>
                ✕
              </button>
            </div>
          </div>
        );
      })
    );

  const svClear =
    savedItems.length > 0 ? (
      <button
        className="mbt mnv"
        type="button"
        style={{ margin: "4px 16px 12px", width: "calc(100% - 32px)" }}
        onClick={() => {
          cartClearSaved();
          say("«در حال بررسی» پاک شد");
        }}
      >
        پاک کردن «در حال بررسی»
      </button>
    ) : null;

  /* cart — با مبلغ ارسال واقعی تنظیمات فروشگاه */
  const ship = tot >= free ? 0 : shipPost;
  const cartView =
    items.length === 0 ? (
      <>
        <div className="mhd2">
          <b>سبد خرید</b>
        </div>
        <div className="mem">
          <span>🛒</span>
          سبد شما خالی است
          <br />
          <br />
          <a className="mbt" href="#app-cats">
            دیدن محصولات
          </a>
        </div>
      </>
    ) : (
      <>
        <div className="mhd2">
          <b>سبد خرید</b>
          <span style={{ marginInlineStart: "auto", color: "var(--mute)", fontSize: 13 }}>{F(cnt)} کالا</span>
        </div>
        <div style={{ padding: "14px 16px 4px", fontSize: 13 }}>
          {tot >= free ? (
            <span className="mok">ارسال شما رایگان است 🎉</span>
          ) : (
            F(free - tot) + " تومان تا ارسال رایگان"
          )}
          <div className="mpg">
            <i style={{ width: `${Math.min(100, (tot / free) * 100)}%` }} />
          </div>
        </div>
        {items.map((x) => {
          const p = findProduct(x.id);
          if (!p) return null;
          return (
            <div className="mci" key={x.id}>
              <div className="mim">
                <PIcon p={p} s={34} />
              </div>
              <div>
                <b>{p.n}</b>
                {F(p.p)} تومان
              </div>
              <div className="mqt">
                <button type="button" aria-label="افزودن" onClick={() => cartChg(x.id, 1)}>
                  +
                </button>
                <span>{F(x.n)}</span>
                <button type="button" aria-label="کاهش / حذف از سبد" onClick={() => {
                  if (x.n <= 1) {
                    say("به «لیست انتظار» منتقل شد ⏳");
                    setSheet("rm"); /* به محض حذف، لیست انتظار نشان داده می‌شود (دستور ۲۸) */
                  }
                  cartChg(x.id, -1);
                }}>
                  −
                </button>
              </div>
            </div>
          );
        })}
        <div className="msm">
          <div className="mrow">
            <span>جمع کالاها</span>
            <span>{F(tot)}</span>
          </div>
          <div className="mrow">
            <span>ارسال</span>
            <span>{ship ? F(ship) : "رایگان"}</span>
          </div>
          <div className="mrow">
            <b>مبلغ نهایی</b>
            <b>{F(tot + ship)} تومان</b>
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          <a className="mbt mnv" href="#checkout">
            ثبت سفارش و پرداخت
          </a>
        </div>
      </>
    );

  /* me — منو به صفحات واقعی سیم‌کشی شده است (سفارش‌ها → #account، علاقه‌مندی‌ها → #wishlist،
     پشتیبانی → #contact، درباره ما → #about) */
  const meView = (
    <>
      <div className="mtop" style={{ paddingBottom: 30 }}>
        <div className="mrow">
          {logo()}
        </div>
      </div>
      <div className="msec">
        <b>حساب کاربری</b>
      </div>
      <div className="mmn">
        <a href="#account">
          <span>📦 سفارش‌های من</span>‹
        </a>
        <a href="#wishlist">
          <span>⭐ علاقه‌مندی‌ها</span>‹
        </a>
        <button type="button" onClick={() => setSheet("car")}>
          <span>خودروی من</span>
          <span>{car || "‹"}</span>
        </button>
        <a href="#contact">
          <span>💬 پشتیبانی</span>‹
        </a>
        <a href="#about">
          <span>ℹ️ درباره ما</span>‹
        </a>
      </div>
    </>
  );

  /* product */
  const p = view.k === "prod" ? prods.find((x) => x.id === view.id) : undefined;
  const prodView =
    view.k === "prod" && p ? (
      <>
        <div className="mhd2">
          <button className="mbk" type="button" aria-label="بازگشت" onClick={goBack}>
            ›
          </button>
          <b style={{ fontSize: 15 }}>{p.c}</b>
          <button
            className="mbk mst2"
            type="button"
            aria-label="علاقه‌مندی"
            style={{ marginInlineStart: "auto" }}
            onClick={() => wishToggle(p.id)}
          >
            {wishIds.includes(p.id) ? "★" : "☆"}
          </button>
        </div>
        <div className="mgal">
          <PIcon p={p} s={120} />
          {cartBtn("mfl")}
        </div>
        <div className="mdots">
          <i />
          <i />
          <i />
        </div>
        <div className="mpi">
          <small style={{ color: "var(--mute)" }}>
            {p.b} · ⭐ {p.r}
          </small>
          <h1>{p.n}</h1>
          <span className="mok">● {p.s ? "موجود · ارسال امروز" : "موجود در انبار"}</span>
        </div>
        <div className="mbx">
          <div>🚚 ارسال همان‌روز در تهران</div>
          <div>🛡️ ضمانت اصالت کالا</div>
          <div>↩️ ۷ روز مهلت بازگشت</div>
          {car ? (
            <div className="mok">✔ سازگار با {car} (طبق انتخاب شما)</div>
          ) : (
            <div
              style={{ color: "var(--n2)", fontWeight: 600, cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onClick={() => setSheet("car")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSheet("car");
              }}
            >
              انتخاب خودرو برای بررسی سازگاری ‹
            </div>
          )}
        </div>
        <div className="msec">
          <b>مشخصات</b>
        </div>
        <div className="mbx">
          <div>برند: {p.b}</div>
          <div>دسته: {p.c}</div>
          <div>گارانتی: اصالت و سلامت فیزیکی</div>
        </div>
        <div className="msec">
          <b>کالاهای مرتبط</b>
        </div>
        <div className="mg">{prods.filter((x) => x.id !== p.id).slice(0, 4).map((x) => card(x))}</div>
      </>
    ) : (
      homeView /* محصول پیدا نشد → خانه (مطابق طراحی) */
    );

  /* ── شیت‌ها ── */
  const overlay = (
    <div className={"mov" + (sheet ? " open" : "")} onClick={() => setSheet(null)}>
      <div className="msh" onClick={(e) => e.stopPropagation()}>
        {sheet === "car" && (
          <>
            <h3>خودروی شما کدام است؟</h3>
            <div className="mcl">
              {CARS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={car === c ? "on" : ""}
                  onClick={() => {
                    setCar(c);
                    setSheet(null);
                    say(`ثبت شد: ${c}`);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <button className="mbt mnv" type="button" onClick={() => setCar("")}>
              پاک کردن انتخاب
            </button>
          </>
        )}
        {sheet === "rm" && (
          <>
            <h3 className="mrmh">⏳ لیست انتظار</h3>
            {/* دستهٔ ۱ (بالاتر): حذف‌شده از سبد */}
            <div className="mrmsec">
              <div className="mrmh">🛒 حذف‌شده از سبد</div>
              {rmRows}
              {rmClear}
            </div>
            {/* دستهٔ ۲: در حال بررسی */}
            <div className="mrmsec">
              <div className="msvh">🤔 در حال بررسی</div>
              {svRows}
              {svClear}
            </div>
          </>
        )}
        {sheet === "ai" && (
          <>
            <h3>خرید با هوش مصنوعی</h3>
            <div className="mml" id="mml" ref={mlRef}>
              {aiHist.map((m, i) => (
                <div key={i} className={"mmsg " + (m.role === "u" ? "mmu" : "mma")}>
                  {m.role === "u" ? m.t : aiDraw(m.t)}
                </div>
              ))}
            </div>
            <form className="maif" onSubmit={aiSend}>
              <input name="t" placeholder="چه قطعه‌ای لازم داری؟" autoComplete="off" />
              <button className="mbt" type="submit" disabled={aiBusy}>
                ارسال
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  /* ── نوار پایین و نوار خرید ── */
  const tabbar =
    view.k !== "prod" ? (
      <nav className="mtab" id="mtab">
        <a href="#app" className={view.k === "home" ? "on" : ""}>
          <TabHome />
          خانه
        </a>
        <a href="#app-cats" className={view.k === "cats" ? "on" : ""}>
          <TabCats />
          دسته‌ها
        </a>
        <a href="#app-cart" className={view.k === "cart" ? "on" : ""}>
          <TabCart />
          سبد
          {cnt > 0 ? <b>{F(cnt)}</b> : null}
        </a>
        {/* تپ قرمز «لیست انتظار» — شیت دو دسته‌ای (دستور ۲۸) */}
        <button type="button" className="rmtab" onClick={() => setSheet("rm")} aria-label="لیست انتظار">
          <TabWait />
          انتظار
          {waitTotal > 0 ? <b className="mcn-rm2">{F(waitTotal)}</b> : null}
        </button>
        <a href="#app-me" className={view.k === "me" ? "on" : ""}>
          <TabMe />
          حساب
        </a>
      </nav>
    ) : null;

  const buybar =
    view.k === "prod" && p ? (
      <div className="mbuy" id="mbb">
        <div className="mpr">
          {p.o ? <s>{F(p.o)}</s> : null}
          <b>{F(p.p)}</b> <small>تومان</small>
        </div>
        <button
          className="mbt"
          type="button"
          aria-label={savedItems.some((x) => x.id === p.id) ? "حذف از لیست انتظار" : "ذخیره در لیست انتظار"}
          style={{
            flex: "0 0 auto",
            width: "auto",
            padding: "13px 14px",
            background: savedItems.some((x) => x.id === p.id) ? "#e5484d22" : "#e5484d",
            color: savedItems.some((x) => x.id === p.id) ? "#e5484d" : "#fff",
          }}
          onClick={() => toggleWait(p.id)}
        >
          {savedItems.some((x) => x.id === p.id) ? "✓" : "⏳"}
        </button>
        <button className="mbt" type="button" onClick={() => add(p.id)}>
          افزودن به سبد
        </button>
      </div>
    ) : null;

  return (
    <div id="mapp">
      <div id="mv">{view.k === "prod" ? prodView : view.k === "cats" ? catsView : view.k === "cart" ? cartView : view.k === "me" ? meView : homeView}</div>
      {tabbar}
      {buybar}
      {overlay}
      {toast ? (
        <div className="mtoast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
