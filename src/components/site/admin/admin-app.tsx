"use client";

/* ═══════════════════════════════════════════════════════════════════════
   پنل مدیریت — فاز D3 (دستور ۲۵ — ۱۴۰۵/۰۸/۱۴)
   • وقتی متغیرهای دیتابیس تنظیم باشند (dbReady) → همهٔ داده‌ها واقعی و زنده
     از Supabase (RLS ادمین) + ورود واقعی ایمیل/رمز + اعلان زندهٔ سفارش و پیام.
   • وقتی اتصال دیتابیس تنظیم نباشد → همان رفتار نمایشی مصوب قبلی (مصوبه ۱۰)
     با دادهٔ محلی و ورود نمایشی — بدون هیچ تغییر گرافیکی.
   طراحی عین مرجع گرافیکی مدیر — فقط سیم‌کشی داده تغییر کرده است.
   ═══════════════════════════════════════════════════════════════════════ */

import { Fragment, useEffect, useState, type FormEvent } from "react";
import { create } from "zustand";
import {
  C, CUSTOMERS, MONTH_SALES, OrderStatus, Product, STATUS_FA, WEEK_SALES,
  type Banner, type Coupon, type Msg, type Order, type Review, type Settings,
} from "@/data/store";
import { F, dg } from "@/lib/format";
import { useAdmin, useData, useUI } from "@/lib/shop-state";
import {
  AdmCoupon, AdmOrderRow, dbAddBanner, dbAddCoupon, dbAdminBanners, dbAdminCoupons,
  dbAdminCategories, dbAdminLive, dbAdminLogin, dbAdminMessages, dbAdminOrders, dbAdminProfiles,
  dbAdminProducts, dbAdminReviews, dbAdminRestore, dbAdminSignOut, dbReady,
  dbDeleteBanner, dbDeleteCoupon, dbDeleteMessage, dbDeleteProduct, dbDeleteReview,
  dbGetSettings, dbReadMessage, dbSaveProduct, dbSaveSettings, dbSetOrderStatus, dbSetReview,
  dbToggleBanner, dbToggleCoupon,
} from "@/lib/supabase";
import { LogoMark } from "../bits";

type Tab =
  | "dash" | "products" | "orders" | "customers" | "reviews"
  | "coupons" | "banners" | "messages" | "reports" | "settings";

const TABS: [Tab, string, string][] = [
  ["dash", "📊", "داشبورد"],
  ["products", "📦", "محصولات"],
  ["orders", "🧾", "سفارش‌ها"],
  ["customers", "👥", "مشتریان"],
  ["reviews", "⭐", "نظرات"],
  ["coupons", "🏷️", "کد تخفیف"],
  ["banners", "🖼️", "بنرها"],
  ["messages", "✉️", "پیام‌ها"],
  ["reports", "📈", "گزارش‌ها"],
  ["settings", "⚙️", "تنظیمات"],
];

const dayFa = (d: number) => (d === 0 ? "امروز" : d === 1 ? "دیروز" : `${F(d)} روز پیش`);

/* مرز «امروز» به ساعت تهران (UTC+۳:۳۰) */
const TEHRAN = 3.5 * 3600_000;
const startOfDay = (daysAgo: number): number =>
  (Math.floor((Date.now() + TEHRAN) / 86_400_000) - daysAgo) * 86_400_000 - TEHRAN;

const FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEK_LABELS = ["۶ روز پیش", "۵ روز پیش", "۴ روز پیش", "۳ روز پیش", "۲ روز پیش", "دیروز", "امروز"];

/** فروش روزهای اخیر (میلیون تومان) از سفارش‌های واقعی */
const weekSalesOf = (orders: AdmOrderRow[]): [string, number][] => {
  const sums = new Array(7).fill(0);
  for (const o of orders) {
    const d = Math.floor((startOfDay(0) - new Date(o.created).getTime()) / 86_400_000);
    if (d >= 0 && d <= 6) sums[6 - d] += o.total;
  }
  return WEEK_LABELS.map((l, i) => [l, sums[i] / 1_000_000] as [string, number]);
};

/** فروش ۶ ماه اخیر (میلیون تومان) — مرز ماه‌ها به ساعت تهران */
const monthSalesOf = (orders: AdmOrderRow[]): [string, number][] => {
  const out: [string, number][] = [];
  const now = new Date(Date.now() + TEHRAN);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getTime());
    d.setUTCMonth(d.getUTCMonth() - i);
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - TEHRAN;
    const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - TEHRAN;
    let sum = 0;
    for (const o of orders) {
      const t = new Date(o.created).getTime();
      if (t >= start && t < end) sum += o.total;
    }
    out.push([FA_MONTHS[d.getUTCMonth()], sum / 1_000_000]);
  }
  return out;
};

/** پیام فارسی برای خطاهای رایج دیتابیس */
const faDbErr = (e: string): string =>
  /foreign key/i.test(e) ? "این مورد در سفارش‌ها استفاده شده و حذف آن ممکن نیست"
  : /duplicate key/i.test(e) ? "این مقدار قبلاً ثبت شده است"
  : /row-level security|JWT/i.test(e) ? "دسترسی مجاز نیست — دوباره وارد شوید"
  : e || "خطای نامشخص";

function StatusBadge({ s }: { s: OrderStatus }) {
  const cls = s === "done" ? "b-ok" : s === "sent" ? "b-warn" : s === "processing" ? "b-off" : "b-err";
  return <span className={"badge " + cls}>{STATUS_FA[s]}</span>;
}

/* ═══════════ دادهٔ واقعی پنل (فقط در حافظهٔ همین نشست — ذخیرهٔ محلی نمی‌شود) ═══════════ */

type AdmData = {
  loaded: boolean;
  err: string;
  orders: AdmOrderRow[];
  prods: Product[];
  reviews: Review[];
  coupons: AdmCoupon[];
  banners: Banner[];
  msgs: Msg[];
  profiles: { name: string; phone: string }[];
  settings: Settings | null;
  cats: [string, string][];
};

const admEmpty: AdmData = {
  loaded: false, err: "", orders: [], prods: [], reviews: [],
  coupons: [], banners: [], msgs: [], profiles: [], settings: null, cats: [],
};

const useAdm = create<AdmData>(() => ({ ...admEmpty }));

const loadAdm = async (): Promise<void> => {
  const [o, p, r, c, b, m, pr, st, ct] = await Promise.all([
    dbAdminOrders(), dbAdminProducts(), dbAdminReviews(), dbAdminCoupons(),
    dbAdminBanners(), dbAdminMessages(), dbAdminProfiles(), dbGetSettings(), dbAdminCategories(),
  ]);
  const err = [o, p, r, c, b, m].some((x) => !x.ok) ? "خطا در بارگذاری بخشی از داده‌ها" : "";
  useAdm.setState({
    loaded: true, err,
    orders: o.ok ? o.rows : [],
    prods: p.ok ? p.rows : [],
    reviews: r.ok ? r.rows : [],
    coupons: c.ok ? c.rows : [],
    banners: b.ok ? b.rows : [],
    msgs: m.ok ? m.rows : [],
    profiles: pr.ok ? pr.rows : [],
    settings: st,
    cats: ct.ok ? ct.rows : [],
  });
};

/* ═══════════ ورود ادمین ═══════════ */

function AdminLogin({ real }: { real: boolean }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    if (real) {
      const r = await dbAdminLogin(u.trim(), p);
      if (r.ok) {
        useAdmin.getState().login();
        useUI.getState().say("خوش آمدید مدیر ✓");
        return; // بارگذاری داده‌ها در useEffect پنل انجام می‌شود
      }
      setErr(r.error === "db-off" ? "اتصال دیتابیس برقرار نیست" : r.error);
      setBusy(false);
      return;
    }
    /* حالت نمایشی مصوب (مصوبه ۱۰) — فقط وقتی دیتابیس تنظیم نیست */
    if (u.trim() === "admin" && p === "admin123") {
      useAdmin.getState().login();
      useUI.getState().say("خوش آمدید مدیر ✓");
      return;
    }
    setErr("نام کاربری یا رمز عبور اشتباه است.");
    setBusy(false);
  };

  return (
    <div className="adm-login">
      <form className="panel fm" onSubmit={submit}>
        <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
          <LogoMark size={56} />
          <b style={{ fontSize: 18 }}>پنل مدیریت ابزار یدکی</b>
          <small style={{ color: "var(--mute)" }}>برای ورود، اطلاعات مدیر را وارد کنید</small>
        </div>
        <label>
          {real ? "ایمیل مدیر" : "نام کاربری"}
          <input
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoFocus
            required
            type={real ? "email" : "text"}
            dir={real ? "ltr" : undefined}
          />
        </label>
        <label>
          رمز عبور
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} required />
        </label>
        {err && <small style={{ color: "#dc2626" }}>{err}</small>}
        <button className="btn" style={{ padding: 12 }} type="submit" disabled={busy}>
          {busy ? "در حال بررسی…" : "ورود به پنل"}
        </button>
        <small style={{ color: "var(--mute)" }}>
          {real ? (
            <>ورود امن با حساب مدیر (دیتابیس فروشگاه) — حساب مدیر توسط پشتیبانی فنی ساخته می‌شود</>
          ) : (
            <>
              نسخه نمایشی — نام کاربری: <b style={{ direction: "ltr", display: "inline-block" }}>admin</b> و رمز:{" "}
              <b style={{ direction: "ltr", display: "inline-block" }}>admin123</b>
            </>
          )}
        </small>
        <a href="#home" className="btn ghost">
          ↩ بازگشت به سایت
        </a>
      </form>
    </div>
  );
}

/* ═══════════ فرم محصول (افزودن / ویرایش) ═══════════ */

function ProductForm({
  init, cats, onClose, onSave,
}: {
  init?: Product;
  cats: [string, string][];
  onClose: () => void;
  onSave: (p: Product, isNew: boolean) => Promise<boolean>;
}) {
  const [f, setF] = useState({
    n: init?.n ?? "",
    c: init?.c ?? cats[0]?.[1] ?? C[0][1],
    b: init?.b ?? "",
    e: init?.e ?? "🔧",
    p: init?.p ? String(init.p) : "",
    o: init?.o ? String(init.o) : "",
    s: init?.s ?? 1,
    r: init?.r ?? "۴٫۵",
  });

  const save = async () => {
    const price = Number(dg(f.p));
    if (!f.n.trim() || !f.b.trim() || !price) {
      useUI.getState().say("نام، برند و قیمت را درست وارد کنید");
      return;
    }
    const data: Product = {
      id: init?.id ?? Math.max(0, ...useData.getState().prods.map((x) => x.id)) + 1,
      n: f.n.trim(),
      c: f.c,
      b: f.b.trim(),
      e: f.e || "🔧",
      p: price,
      o: Number(dg(f.o)) || 0,
      s: f.s,
      r: f.r,
    };
    const ok = await onSave(data, !init);
    if (!ok) return;
    useUI.getState().say(init ? "محصول ویرایش شد ✓" : "محصول جدید اضافه شد ✓");
    onClose();
  };

  /* keyboard: Esc closes the modal */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="mod" onClick={onClose} role="dialog" aria-modal="true">
      <div className="panel fm" onClick={(e) => e.stopPropagation()}>
        <b>{init ? "ویرایش محصول" : "افزودن محصول جدید"}</b>
        <div className="two">
          <label>
            نام محصول
            <input value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} autoFocus />
          </label>
          <label>
            دسته
            <select value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })}>
              {(cats.length ? cats : C).map(([, n]) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="two">
          <label>
            برند
            <input value={f.b} onChange={(e) => setF({ ...f, b: e.target.value })} />
          </label>
          <label>
            آیکون (ایموجی)
            <input value={f.e} onChange={(e) => setF({ ...f, e: e.target.value })} maxLength={4} style={{ textAlign: "center" }} />
          </label>
        </div>
        <div className="two">
          <label>
            قیمت (تومان)
            <input value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} inputMode="numeric" placeholder="185000" />
          </label>
          <label>
            قیمت قبل از تخفیف (0 = ندارد)
            <input value={f.o} onChange={(e) => setF({ ...f, o: e.target.value })} inputMode="numeric" placeholder="0" />
          </label>
        </div>
        <div className="two">
          <label>
            وضعیت موجودی
            <select value={f.s} onChange={(e) => setF({ ...f, s: Number(e.target.value) })}>
              <option value={1}>موجود · ارسال امروز</option>
              <option value={0}>موجود در انبار</option>
            </select>
          </label>
          <label>
            امتیاز
            <input value={f.r} onChange={(e) => setF({ ...f, r: e.target.value })} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="button" onClick={save} style={{ flex: 1 }}>
            ذخیره
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ خود پنل ═══════════ */

export function AdminApp() {
  const logged = useAdmin((s) => s.logged);
  const real = dbReady();
  const adm = useAdm();
  const [tab, setTab] = useState<Tab>("dash");
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [openOrder, setOpenOrder] = useState("");
  const [prodModal, setProdModal] = useState<Product | "new" | null>(null);
  const [qProd, setQProd] = useState("");
  const [booting, setBooting] = useState(real);
  const say = useUI((s) => s.say);
  const dProds = useData((s) => s.prods);
  const dOrders = useData((s) => s.orders);
  const dReviews = useData((s) => s.reviews);
  const dCoupons = useData((s) => s.coupons);
  const dBanners = useData((s) => s.banners);
  const dMsgs = useData((s) => s.msgs);
  const dSettings = useData((s) => s.settings);

  /* بازیابی نشست واقعی ادمین پس از رفرش (فقط حالت واقعی) —
     در حالت نمایشی booting از ابتدا false است و هیچ اثری اجرا نمی‌شود */
  useEffect(() => {
    if (!real) return;
    (async () => {
      const ok = await dbAdminRestore();
      if (ok) useAdmin.getState().login();
      else useAdmin.getState().logout();
      setBooting(false); /* پس از پایان بررسی — درون callback ناهمگام */
    })();
  }, [real]);

  /* بارگذاری داده‌ها + اعلان زنده — هر بار که ادمین وارد می‌شود */
  useEffect(() => {
    if (!real || !logged) return;
    let cancelled = false;
    let off: (() => void) | undefined;
    (async () => {
      await loadAdm();
      if (cancelled) return;
      off = dbAdminLive(
        () => {
          loadAdm();
          useUI.getState().say("🧾 سفارش جدید ثبت شد");
        },
        () => {
          loadAdm();
          useUI.getState().say("✉️ پیام جدید دریافت شد");
        }
      );
    })();
    return () => {
      cancelled = true;
      off?.();
    };
  }, [real, logged]);

  /* ── اقدامات — واقعی یا نمایشی ── */

  const actSaveProduct = async (data: Product, isNew: boolean): Promise<boolean> => {
    if (!real) {
      if (isNew) useData.getState().addProd(data);
      else useData.getState().updProd(data);
      return true;
    }
    const r = await dbSaveProduct(isNew ? { ...data, id: undefined } : data);
    if (!r.ok) {
      useUI.getState().say("ذخیره ناموفق: " + faDbErr(r.error));
      return false;
    }
    await loadAdm();
    return true;
  };

  const actDelProduct = async (p: Product) => {
    if (!real) {
      useData.getState().delProd(p.id);
      useUI.getState().say("محصول حذف شد");
      return;
    }
    const r = await dbDeleteProduct(p.id);
    if (!r.ok) {
      useUI.getState().say("حذف ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say("محصول حذف شد");
    loadAdm();
  };

  const actSetOrderStatus = async (code: string, s: OrderStatus) => {
    if (!real) {
      useData.getState().setOrderStatus(code, s);
      useUI.getState().say(`وضعیت ${code} → ${STATUS_FA[s]}`);
      return;
    }
    const prev = useAdm.getState().orders;
    useAdm.setState({ orders: prev.map((o) => (o.code === code ? { ...o, status: s } : o)) }); // خوش‌بینانه
    const r = await dbSetOrderStatus(code, s);
    if (!r.ok) {
      useAdm.setState({ orders: prev });
      useUI.getState().say("ثبت وضعیت ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say(`وضعیت ${code} → ${STATUS_FA[s]} ✓`);
  };

  const actSetReview = async (id: number, s: Review["status"], msg: string) => {
    if (!real) {
      useData.getState().setReviewStatus(id, s);
      useUI.getState().say(msg);
      return;
    }
    const r = await dbSetReview(id, s);
    if (!r.ok) {
      useUI.getState().say("ثبت ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say(msg);
    loadAdm();
  };

  const actDelReview = async (id: number) => {
    if (!real) {
      useData.getState().delReview(id);
      useUI.getState().say("نظر حذف شد");
      return;
    }
    const r = await dbDeleteReview(id);
    if (!r.ok) {
      useUI.getState().say("حذف ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say("نظر حذف شد");
    loadAdm();
  };

  const actAddCoupon = async (code: string, percent: number, max: number): Promise<boolean> => {
    if (!real) {
      if (useData.getState().coupons.some((x) => x.code === code)) {
        useUI.getState().say("این کد قبلاً ثبت شده");
        return false;
      }
      useData.getState().addCoupon({ code, percent, max, active: true });
      return true;
    }
    if (useAdm.getState().coupons.some((x) => x.code === code)) {
      useUI.getState().say("این کد قبلاً ثبت شده");
      return false;
    }
    const r = await dbAddCoupon(code, percent, max);
    if (!r.ok) {
      useUI.getState().say("ساخت کد ناموفق: " + faDbErr(r.error));
      return false;
    }
    loadAdm();
    return true;
  };

  const actToggleCoupon = async (c: Coupon | AdmCoupon) => {
    if (!real) {
      useData.getState().toggleCoupon(c.code);
      return;
    }
    const r = await dbToggleCoupon(c.code, !c.active);
    if (!r.ok) {
      useUI.getState().say("ثبت ناموفق: " + faDbErr(r.error));
      return;
    }
    loadAdm();
  };

  const actDelCoupon = async (code: string) => {
    if (!real) {
      useData.getState().delCoupon(code);
      useUI.getState().say("کد حذف شد");
      return;
    }
    const r = await dbDeleteCoupon(code);
    if (!r.ok) {
      useUI.getState().say("حذف ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say("کد حذف شد");
    loadAdm();
  };

  const actAddBanner = async (t: string, d: string, href: string, bg: string): Promise<boolean> => {
    if (!real) {
      useData.getState().addBanner({ id: Date.now(), t, d, href, bg, active: true });
      return true;
    }
    const r = await dbAddBanner(t, d, href, bg);
    if (!r.ok) {
      useUI.getState().say("افزودن ناموفق: " + faDbErr(r.error));
      return false;
    }
    loadAdm();
    return true;
  };

  const actToggleBanner = async (b: Banner) => {
    if (!real) {
      useData.getState().toggleBanner(b.id);
      return;
    }
    const r = await dbToggleBanner(b.id, !b.active);
    if (!r.ok) {
      useUI.getState().say("ثبت ناموفق: " + faDbErr(r.error));
      return;
    }
    loadAdm();
  };

  const actDelBanner = async (b: Banner) => {
    if (!real) {
      useData.getState().delBanner(b.id);
      useUI.getState().say("بنر حذف شد");
      return;
    }
    const r = await dbDeleteBanner(b.id);
    if (!r.ok) {
      useUI.getState().say("حذف ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say("بنر حذف شد");
    loadAdm();
  };

  const actReadMsg = async (id: number) => {
    if (!real) {
      useData.getState().readMsg(id);
      return;
    }
    const r = await dbReadMessage(id);
    if (!r.ok) {
      useUI.getState().say("ثبت ناموفق: " + faDbErr(r.error));
      return;
    }
    loadAdm();
  };

  const actDelMsg = async (id: number) => {
    if (!real) {
      useData.getState().delMsg(id);
      useUI.getState().say("پیام حذف شد");
      return;
    }
    const r = await dbDeleteMessage(id);
    if (!r.ok) {
      useUI.getState().say("حذف ناموفق: " + faDbErr(r.error));
      return;
    }
    useUI.getState().say("پیام حذف شد");
    loadAdm();
  };

  const actSaveSettings = async (s: Settings): Promise<boolean> => {
    if (!real) {
      useData.getState().saveSettings(s);
      return true;
    }
    const r = await dbSaveSettings(s);
    if (!r.ok) {
      useUI.getState().say("ذخیره ناموفق: " + faDbErr(r.error));
      return false;
    }
    useData.getState().saveSettings(s); // اعمال فوری در همین مرورگر
    useAdm.setState({ settings: s });
    return true;
  };

  const doLogout = () => {
    if (real) dbAdminSignOut();
    useAdm.setState({ ...admEmpty });
    useAdmin.getState().logout();
    useUI.getState().say("از پنل خارج شدید");
  };

  /* ── حالت‌های ورود/بارگذاری ── */

  if (booting && real && !logged)
    return (
      <div className="adm-login">
        <div className="panel fm" style={{ textAlign: "center", gap: 8 }}>
          <LogoMark size={44} />
          <b>در حال بررسی نشست مدیریت…</b>
        </div>
      </div>
    );

  if (!logged) return <AdminLogin real={real} />;

  /* ── دادهٔ یکسان‌شده (واقعی یا نمایشی) ── */
  const orders: (Order | AdmOrderRow)[] = real ? adm.orders : dOrders;
  const prods = real ? adm.prods : dProds;
  const reviews = real ? adm.reviews : dReviews;
  const coupons = real ? adm.coupons : dCoupons;
  const banners = real ? adm.banners : dBanners;
  const msgs = real ? adm.msgs : dMsgs;
  const settings = real ? adm.settings ?? dSettings : dSettings;

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders;
  const unread = msgs.filter((m) => m.unread).length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const outOfStock = prods.filter((p) => !p.s);
  const prodsList = prods.filter((p) => !qProd || p.n.includes(qProd) || p.b.includes(qProd));

  /* گزارش‌ها (هر دو حالت) */
  const doneTotal = orders.filter((o) => o.status === "done").reduce((a, o) => a + o.total, 0);
  const statusCount = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const topMap = new Map<number, number>();
  orders.forEach((o) => o.lines?.forEach(([pid, n]) => topMap.set(pid, (topMap.get(pid) ?? 0) + n)));
  const topItems = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catCount = C.map(([e, n]) => [n, prods.filter((p) => p.c === n).length] as const);
  const maxCat = Math.max(1, ...catCount.map(([, v]) => v));

  /* آمار واقعی داشبورد (فقط حالت واقعی) */
  const admOrders = real ? adm.orders : [];
  const todaySale = admOrders.filter((o) => new Date(o.created).getTime() >= startOfDay(0)).reduce((a, o) => a + o.total, 0);
  const ydaySale = admOrders
    .filter((o) => {
      const t = new Date(o.created).getTime();
      return t >= startOfDay(1) && t < startOfDay(0);
    })
    .reduce((a, o) => a + o.total, 0);
  const todayCount = admOrders.filter((o) => new Date(o.created).getTime() >= startOfDay(0)).length;
  const custCount = new Set(admOrders.map((o) => dg(o.phone))).size;
  const newOrdersCount = admOrders.filter((o) => o.status === "processing").length;
  const weekData = real ? weekSalesOf(admOrders) : WEEK_SALES;
  const monthData = real ? monthSalesOf(admOrders) : MONTH_SALES;
  const maxSale = Math.max(...weekData.map(([, v]) => v));
  const maxMonth = Math.max(...monthData.map(([, v]) => v));

  /* مشتریان واقعی = تجمیع سفارش‌ها + ثبت‌نام‌شده‌ها */
  const customersReal: { name: string; phone: string; city: string; orders: number; spent: number; last: string }[] = (() => {
    const map = new Map<string, { name: string; phone: string; city: string; orders: number; spent: number; last: string }>();
    for (const pr of adm.profiles)
      map.set(dg(pr.phone), { name: pr.name, phone: pr.phone, city: "—", orders: 0, spent: 0, last: "—" });
    for (const o of admOrders) {
      const k = dg(o.phone);
      const cur = map.get(k) ?? { name: o.name, phone: o.phone, city: "—", orders: 0, spent: 0, last: "—" };
      if (cur.name === "—") cur.name = o.name;
      cur.orders += 1;
      cur.spent += o.total;
      cur.last = dayFa(o.day);
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  })();

  /* اعداد داشبورد (واقعی یا نمایشی) */
  const dashSale = real ? todaySale : 12450000;
  const dashNew = real ? newOrdersCount : orders.filter((o) => o.day === 0).length;
  const dashCust = real ? custCount : 1248;
  const dashFourth = real ? todayCount : 3940;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <LogoMark size={34} />
          پنل مدیریت
        </div>
        {TABS.map(([id, e, label]) => (
          <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <span>{e}</span> {label}
            {id === "messages" && unread > 0 ? <span className="badge b-err">{F(unread)}</span> : null}
            {id === "reviews" && pendingReviews > 0 ? <span className="badge b-warn">{F(pendingReviews)}</span> : null}
          </button>
        ))}
        <div className="sep" />
        <button type="button" onClick={doLogout}>
          🚪 خروج از پنل
        </button>
        <a href="#home">↩️ بازگشت به سایت</a>
      </aside>

      <main className="adm-main">
        {/* ── داشبورد ── */}
        {tab === "dash" && (
          <>
            <div className="adm-top">
              <h1>داشبورد</h1>
              <small style={{ color: "var(--mute)" }}>
                {real
                  ? adm.err
                    ? `${adm.err} — `
                    : "متصل به دیتابیس فروشگاه — داده‌های زنده"
                  : "داده‌های نمایشی — متصل به نسخه نهایی"}
                {real && adm.err && (
                  <button type="button" className="btn ghost" style={{ padding: "2px 10px", fontSize: 11, marginInlineStart: 6 }} onClick={() => loadAdm()}>
                    تلاش مجدد
                  </button>
                )}
              </small>
            </div>
            <div className="adm-stats">
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>فروش امروز</small>
                <b>{F(dashSale)}</b>
                <small>تومان · </small>
                <small className={real ? "" : "up"}>{real ? `دیروز: ${F(ydaySale)}` : "↑ ۱۲٪ نسبت به دیروز"}</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>{real ? "سفارش‌های در انتظار" : "سفارش‌های جدید"}</small>
                <b>{F(dashNew)}</b>
                <small className={real ? "" : "up"}>{real ? `امروز: ${F(todayCount)} سفارش` : "↑ ۳ مورد"}</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مشتریان</small>
                <b>{F(dashCust)}</b>
                <small className={real ? "" : "up"}>{real ? `ثبت‌نام‌شده: ${F(adm.profiles.length)}` : "↑ ۱۸ امروز"}</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>{real ? "سفارش‌های امروز" : "بازدید امروز"}</small>
                <b>{F(dashFourth)}</b>
                <small className={real ? "" : "down"}>{real ? `مجموع کل: ${F(orders.length)} سفارش` : "↓ ۴٪"}</small>
              </div>
            </div>
            <div className="adm-cols">
              <div className="panel">
                <b>فروش ۷ روز اخیر (میلیون تومان)</b>
                <div className="adm-chart" style={{ marginTop: 14 }}>
                  {weekData.map(([d, v], i) => (
                    <div key={d} className={i === weekData.length - 1 ? "hot" : ""}>
                      <i style={{ height: `${(v / maxSale) * 100}%` }} />
                      <small>{F(Math.round(v))}</small>
                      <small>{d}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel" style={{ overflowX: "auto" }}>
                <b>موجودی بحرانی</b>
                <table className="adm-table">
                  <tbody>
                    {outOfStock.length === 0 ? (
                      <tr>
                        <td>همه محصولات موجودند ✓</td>
                      </tr>
                    ) : (
                      outOfStock.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {p.e} {p.n}
                          </td>
                          <td>
                            <span className="badge b-err">انبار</span>
                          </td>
                          <td>
                            <button
                              className="btn"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              type="button"
                              onClick={async () => {
                                if (await actSaveProduct({ ...p, s: 1 }, false)) say(`«${p.n}» موجود شد ✓`);
                              }}
                            >
                              افزودن موجودی
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="panel" style={{ marginTop: 14, overflowX: "auto" }}>
              <b>آخرین سفارش‌ها</b>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>مشتری</th>
                    <th>اقلام</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.code}>
                      <td>{o.code}</td>
                      <td>{o.name}</td>
                      <td>{F(o.items)}</td>
                      <td>{F(o.total)}</td>
                      <td>
                        <StatusBadge s={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── محصولات ── */}
        {tab === "products" && (
          <>
            <div className="adm-top">
              <h1>محصولات ({F(prods.length)})</h1>
              <button className="btn" type="button" onClick={() => setProdModal("new")}>
                + افزودن محصول
              </button>
            </div>
            <input
              value={qProd}
              onChange={(e) => setQProd(e.target.value)}
              placeholder="جستجوی نام یا برند..."
              style={{ padding: 10, border: "1px solid var(--line)", borderRadius: 10, font: "inherit", background: "var(--card)", color: "var(--ink)", width: "100%", marginBottom: 12 }}
            />
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>دسته</th>
                    <th>برند</th>
                    <th>قیمت</th>
                    <th>موجودی</th>
                    <th>امتیاز</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prodsList.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.e} <b>{p.n}</b>
                      </td>
                      <td>{p.c}</td>
                      <td>{p.b}</td>
                      <td>{F(p.p)}</td>
                      <td>{p.s ? <span className="badge b-ok">موجود</span> : <span className="badge b-off">انبار</span>}</td>
                      <td>⭐ {p.r}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} type="button" onClick={() => setProdModal(p)}>
                          ویرایش
                        </button>{" "}
                        <button
                          className="btn ghost"
                          style={{ padding: "3px 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                          type="button"
                          onClick={() => {
                            if (confirm(`حذف «${p.n}»؟`)) actDelProduct(p);
                          }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── سفارش‌ها ── */}
        {tab === "orders" && (
          <>
            <div className="adm-top">
              <h1>سفارش‌ها ({F(orders.length)})</h1>
              <div className="bar" style={{ marginBottom: 0 }}>
                <button type="button" className={filter ? "" : "on"} onClick={() => setFilter("")}>
                  همه
                </button>
                {(Object.keys(STATUS_FA) as OrderStatus[]).map((s) => (
                  <button key={s} type="button" className={filter === s ? "on" : ""} onClick={() => setFilter(s)}>
                    {STATUS_FA[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>مشتری</th>
                    <th>موبایل</th>
                    <th>اقلام</th>
                    <th>مبلغ (تومان)</th>
                    <th>زمان</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const ro = o as AdmOrderRow;
                    return (
                      <FragmentRow
                        key={o.code}
                        code={o.code}
                        open={openOrder === o.code}
                        onToggle={() => setOpenOrder(openOrder === o.code ? "" : o.code)}
                        cells={[
                          <b key="c">{o.code}</b>,
                          o.name,
                          o.phone,
                          F(o.items),
                          F(o.total),
                          dayFa(o.day),
                          <StatusBadge key="s" s={o.status} />,
                        ]}
                        detail={
                          <>
                            {real
                              ? ro.itemsDetail.map((it) => {
                                  const p = prods.find((x) => x.id === it.pid);
                                  return (
                                    <div className="sum" key={it.pid}>
                                      <span>
                                        {p ? `${p.e} ${p.n}` : `کالا #${it.pid}`} × {F(it.qty)}
                                      </span>
                                      <span>{F(it.price * it.qty)}</span>
                                    </div>
                                  );
                                })
                              : o.lines?.map(([pid, n]) => {
                                  const p = prods.find((x) => x.id === pid);
                                  return (
                                    <div className="sum" key={pid}>
                                      <span>
                                        {p ? `${p.e} ${p.n}` : `کالا #${pid}`} × {F(n)}
                                      </span>
                                      <span>{p ? F(p.p * n) : "—"}</span>
                                    </div>
                                  );
                                })}
                            {real && (
                              <>
                                <div className="sum">
                                  <span>جمع کالاها</span>
                                  <span>{F(ro.subtotal)}</span>
                                </div>
                                {ro.discount > 0 && (
                                  <div className="sum" style={{ color: "var(--ok)" }}>
                                    <span>تخفیف {ro.coupon ? `(${ro.coupon})` : ""}</span>
                                    <span>−{F(ro.discount)}</span>
                                  </div>
                                )}
                                <div className="sum">
                                  <span>ارسال</span>
                                  <span>{ro.shipping ? F(ro.shipping) : "رایگان"}</span>
                                </div>
                              </>
                            )}
                            <div className="sum">
                              <span>نشانی</span>
                              <span style={{ maxWidth: 340, textAlign: "left" }}>{o.addr ?? "—"}</span>
                            </div>
                            <div className="sum">
                              <span>روش ارسال / پرداخت</span>
                              <span>
                                {o.ship === "peyk" ? "پیک" : "پست"} · {o.pay === "cod" ? "در محل" : "آنلاین"}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                              <small style={{ width: "100%", color: "var(--mute)" }}>تغییر وضعیت سفارش:</small>
                              {(["processing", "sent", "done", "canceled"] as OrderStatus[]).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className={o.status === s ? "btn" : "btn ghost"}
                                  style={{ padding: "5px 12px", fontSize: 12 }}
                                  onClick={() => actSetOrderStatus(o.code, s)}
                                >
                                  {STATUS_FA[s]}
                                </button>
                              ))}
                            </div>
                          </>
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── مشتریان ── */}
        {tab === "customers" && (
          <>
            <div className="adm-top">
              <h1>مشتریان ({F(real ? customersReal.length : CUSTOMERS.length)})</h1>
              {real && <small style={{ color: "var(--mute)" }}>از سفارش‌های واقعی + کاربران ثبت‌نام‌شده</small>}
            </div>
            <div className="panel" style={{ padding: 8, overflowX: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>موبایل</th>
                    <th>شهر</th>
                    <th>سفارش‌ها</th>
                    <th>مجموع خرید (تومان)</th>
                    <th>آخرین خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {(real
                    ? customersReal.map((c) => (
                        <tr key={c.phone}>
                          <td>
                            <b>{c.name}</b>
                          </td>
                          <td>{c.phone}</td>
                          <td>{c.city}</td>
                          <td>{F(c.orders)}</td>
                          <td>{F(c.spent)}</td>
                          <td>{c.last}</td>
                        </tr>
                      ))
                    : CUSTOMERS.map((c) => (
                        <tr key={c.phone}>
                          <td>
                            <b>{c.name}</b>
                          </td>
                          <td>{c.phone}</td>
                          <td>{c.city}</td>
                          <td>{F(c.orders)}</td>
                          <td>{F(c.spent)}</td>
                          <td>{c.last}</td>
                        </tr>
                      )))}
                  {real && customersReal.length === 0 && (
                    <tr>
                      <td colSpan={6}>هنوز مشتری‌ای ثبت نشده است.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── نظرات ── */}
        {tab === "reviews" && (
          <>
            <div className="adm-top">
              <h1>نظرات ({F(reviews.length)})</h1>
              <small style={{ color: "var(--mute)" }}>نظرات تأییدشده در صفحه محصول نمایش داده می‌شوند</small>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {reviews.length === 0 && <div className="panel">نظری ثبت نشده است.</div>}
              {reviews.map((r) => {
                const p = prods.find((x) => x.id === r.pid);
                return (
                  <div className="panel" key={r.id} style={{ padding: 14 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{r.name}</b>
                      <small style={{ color: "var(--mute)" }}>برای {p ? p.n : `کالا #${r.pid}`}</small>
                      <span className={"badge " + (r.status === "ok" ? "b-ok" : r.status === "pending" ? "b-warn" : "b-err")}>
                        {r.status === "ok" ? "تأیید شده" : r.status === "pending" ? "در انتظار تأیید" : "رد شده"}
                      </span>
                      <span style={{ marginInlineStart: "auto" }}>⭐ {r.r}</span>
                    </div>
                    <p style={{ margin: "8px 0", color: "var(--mute)" }}>{r.text}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {r.status !== "ok" && (
                        <button
                          className="btn"
                          style={{ padding: "5px 14px", fontSize: 12 }}
                          type="button"
                          onClick={() => actSetReview(r.id, "ok", "نظر تأیید شد ✓")}
                        >
                          ✔ تأیید
                        </button>
                      )}
                      {r.status !== "no" && (
                        <button
                          className="btn ghost"
                          style={{ padding: "5px 14px", fontSize: 12 }}
                          type="button"
                          onClick={() => actSetReview(r.id, "no", "نظر رد شد")}
                        >
                          ✖ رد
                        </button>
                      )}
                      <button
                        className="btn ghost"
                        style={{ padding: "5px 14px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                        type="button"
                        onClick={() => actDelReview(r.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── کد تخفیف ── */}
        {tab === "coupons" && (
          <>
            <div className="adm-top">
              <h1>کدهای تخفیف ({F(coupons.length)})</h1>
            </div>
            <CouponAdd onAdd={actAddCoupon} />
            <div className="panel" style={{ padding: 8, marginTop: 12, overflowX: "auto" }}>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>درصد</th>
                    <th>سقف تخفیف (تومان)</th>
                    <th>استفاده</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <b style={{ direction: "ltr", display: "inline-block" }}>{c.code}</b>
                      </td>
                      <td>٪{F(c.percent)}</td>
                      <td>{F(c.max)}</td>
                      <td>{real ? F((c as AdmCoupon).used) : "—"}</td>
                      <td>{c.active ? <span className="badge b-ok">فعال</span> : <span className="badge b-off">غیرفعال</span>}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} type="button" onClick={() => actToggleCoupon(c)}>
                          {c.active ? "غیرفعال کن" : "فعال کن"}
                        </button>{" "}
                        <button
                          className="btn ghost"
                          style={{ padding: "3px 10px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                          type="button"
                          onClick={() => actDelCoupon(c.code)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── بنرها ── */}
        {tab === "banners" && (
          <>
            <div className="adm-top">
              <h1>بنرهای صفحه اصلی</h1>
            </div>
            <BannerAdd onAdd={actAddBanner} />
            <div className="adm-cols" style={{ marginTop: 12 }}>
              {banners.map((b) => (
                <div className="panel" key={b.id} style={{ padding: 14 }}>
                  <a
                    href={b.href}
                    onClick={(e) => e.preventDefault()}
                    style={{ background: b.bg, borderRadius: 14, padding: 16, color: "#fff", display: "block", marginBottom: 10 }}
                  >
                    <b>{b.t}</b>
                    <br />
                    {b.d}
                  </a>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {b.active ? <span className="badge b-ok">فعال</span> : <span className="badge b-off">غیرفعال</span>}
                    <small style={{ color: "var(--mute)", direction: "ltr" }}>{b.href}</small>
                    <button className="btn ghost" style={{ padding: "4px 12px", fontSize: 12, marginInlineStart: "auto" }} type="button" onClick={() => actToggleBanner(b)}>
                      {b.active ? "پنهان کن" : "نمایش بده"}
                    </button>
                    <button
                      className="btn ghost"
                      style={{ padding: "4px 12px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                      type="button"
                      onClick={() => actDelBanner(b)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── پیام‌ها ── */}
        {tab === "messages" && (
          <>
            <div className="adm-top">
              <h1>
                پیام‌های تماس با ما {unread > 0 && <span className="badge b-err">{F(unread)} خوانده‌نشده</span>}
              </h1>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {msgs.length === 0 && <div className="panel">پیامی وجود ندارد.</div>}
              {msgs.map((m) => (
                <div className="panel" key={m.id} style={{ padding: 14, borderColor: m.unread ? "var(--or)" : undefined }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <b>{m.name}</b>
                    <small style={{ color: "var(--mute)" }}>{m.phone}</small>
                    <span className="badge b-off">{m.subject}</span>
                    {m.unread && <span className="badge b-err">جدید</span>}
                    <small style={{ marginInlineStart: "auto", color: "var(--mute)" }}>{dayFa(m.day)}</small>
                  </div>
                  <p style={{ margin: "8px 0", color: "var(--ink)" }}>{m.text}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {m.unread && (
                      <button className="btn" style={{ padding: "5px 14px", fontSize: 12 }} type="button" onClick={() => actReadMsg(m.id)}>
                        ✔ خوانده شد
                      </button>
                    )}
                    <button
                      className="btn ghost"
                      style={{ padding: "5px 14px", fontSize: 12, color: "#dc2626", borderColor: "#dc262655" }}
                      type="button"
                      onClick={() => actDelMsg(m.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── گزارش‌ها ── */}
        {tab === "reports" && (
          <>
            <div className="adm-top">
              <h1>گزارش فروش</h1>
            </div>
            <div className="adm-stats">
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مجموع فروش سفارش‌های تحویل‌شده</small>
                <b>{F(doneTotal)}</b>
                <small>تومان</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>مجموع سفارش‌ها</small>
                <b>{F(orders.length)}</b>
                <small>سفارش</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>میانگین سبد خرید</small>
                <b>{F(Math.round(orders.reduce((a, o) => a + o.total, 0) / Math.max(1, orders.length)))}</b>
                <small>تومان</small>
              </div>
              <div className="panel">
                <small style={{ color: "var(--mute)" }}>تعداد محصولات</small>
                <b>{F(prods.length)}</b>
                <small>کالا</small>
              </div>
            </div>
            <div className="adm-cols">
              <div className="panel">
                <b>فروش ۶ ماه اخیر (میلیون تومان)</b>
                <div className="adm-chart" style={{ marginTop: 14 }}>
                  {monthData.map(([d, v], i) => (
                    <div key={d} className={i === monthData.length - 1 ? "hot" : ""}>
                      <i style={{ height: `${(v / maxMonth) * 100}%` }} />
                      <small>{F(v)}</small>
                      <small>{d}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <b>وضعیت سفارش‌ها</b>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {(Object.keys(STATUS_FA) as OrderStatus[]).map((s) => (
                    <div key={s}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>{STATUS_FA[s]}</span>
                        <b>{F(statusCount(s))}</b>
                      </div>
                      <div className="prog">
                        <i
                          style={{
                            width: `${(statusCount(s) / Math.max(1, orders.length)) * 100}%`,
                            background: s === "canceled" ? "#dc2626" : s === "done" ? "var(--ok)" : "var(--or)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <b>پرفروش‌ترین کالاها (بر اساس اقلام سفارش‌ها)</b>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>محصول</th>
                    <th>تعداد فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length === 0 && (
                    <tr>
                      <td colSpan={3}>هنوز سفارشی با اقلام ثبت نشده است.</td>
                    </tr>
                  )}
                  {topItems.map(([pid, n], i) => {
                    const p = prods.find((x) => x.id === pid);
                    return (
                      <tr key={pid}>
                        <td>{F(i + 1)}</td>
                        <td>
                          {p ? `${p.e} ${p.n}` : `کالا #${pid}`}
                        </td>
                        <td>
                          <b>{F(n)}</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <b>سهم دسته‌بندی‌ها از محصولات</b>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {catCount.map(([n, v]) => (
                  <div key={n}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{n}</span>
                      <b>{F(v)} کالا</b>
                    </div>
                    <div className="prog">
                      <i style={{ width: `${(v / maxCat) * 100}%`, background: "var(--navy2)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── تنظیمات ── */}
        {tab === "settings" && <SettingsTab settings={settings} real={real} onSave={actSaveSettings} />}
      </main>

      {prodModal && (
        <ProductForm
          init={prodModal === "new" ? undefined : prodModal}
          cats={real && adm.cats.length ? adm.cats : C}
          onClose={() => setProdModal(null)}
          onSave={actSaveProduct}
        />
      )}
    </div>
  );
}

/* ── ردیف سفارش با جزئیات بازشو ── */

function FragmentRow({
  code, open, onToggle, cells, detail,
}: {
  code: string;
  open: boolean;
  onToggle: () => void;
  cells: React.ReactNode[];
  detail: React.ReactNode;
}) {
  return (
    <Fragment key={code}>
      <tr
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        style={{ cursor: "pointer" }}
      >
        {cells.map((c, i) => (
          <td key={i}>{c}</td>
        ))}
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: "var(--bg)", borderRadius: 10 }}>
            <div style={{ padding: 10 }}>{detail}</div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

/* ── افزودن کد تخفیف ── */

function CouponAdd({ onAdd }: { onAdd: (code: string, percent: number, max: number) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [max, setMax] = useState("300000");

  const add = async () => {
    const c = code.trim().toUpperCase();
    const pc = Number(dg(percent));
    const mx = Number(dg(max));
    if (!c || !pc || !mx) {
      useUI.getState().say("کد، درصد و سقف را درست وارد کنید");
      return;
    }
    const ok = await onAdd(c, pc, mx);
    if (!ok) return;
    useUI.getState().say("کد تخفیف ساخته شد ✓");
    setCode("");
  };

  return (
    <div className="panel fm">
      <b>ساخت کد تخفیف جدید</b>
      <div className="two">
        <label>
          کد (لاتین)
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="NOWRUZ" style={{ direction: "ltr" }} />
        </label>
        <label>
          درصد تخفیف
          <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" />
        </label>
      </div>
      <label>
        سقف تخفیف (تومان)
        <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" />
      </label>
      <button className="btn" type="button" onClick={add}>
        + ساخت کد
      </button>
    </div>
  );
}

/* ── افزودن بنر ── */

function BannerAdd({ onAdd }: { onAdd: (t: string, d: string, href: string, bg: string) => Promise<boolean> }) {
  const [t, setT] = useState("");
  const [d, setD] = useState("");
  const [href, setHref] = useState("#offers");
  const [bg, setBg] = useState("linear-gradient(135deg,#ff6a1a,#c2410c)");

  const add = async () => {
    if (!t.trim()) {
      useUI.getState().say("عنوان بنر را وارد کنید");
      return;
    }
    const ok = await onAdd(t.trim(), d.trim(), href, bg);
    if (!ok) return;
    useUI.getState().say("بنر اضافه شد ✓");
    setT("");
    setD("");
  };

  return (
    <div className="panel fm">
      <b>بنر جدید</b>
      <div className="two">
        <label>
          عنوان
          <input value={t} onChange={(e) => setT(e.target.value)} placeholder="⚡ تخفیف پاییزی" />
        </label>
        <label>
          توضیح کوتاه
          <input value={d} onChange={(e) => setD(e.target.value)} placeholder="تا ۳۰٪ تخفیف" />
        </label>
      </div>
      <div className="two">
        <label>
          لینک مقصد
          <select value={href} onChange={(e) => setHref(e.target.value)}>
            <option value="#offers">تخفیف‌ها</option>
            <option value="#cats">دسته‌بندی‌ها</option>
            <option value="#shop">فروشگاه</option>
            <option value="#contact">تماس با ما</option>
          </select>
        </label>
        <label>
          رنگ پس‌زمینه
          <select value={bg} onChange={(e) => setBg(e.target.value)}>
            <option value="linear-gradient(135deg,#ff6a1a,#c2410c)">نارنجی</option>
            <option value="linear-gradient(135deg,#143a66,#0b1f3a)">سرمه‌ای</option>
            <option value="linear-gradient(135deg,#17a05d,#0e7a45)">سبز</option>
          </select>
        </label>
      </div>
      <button className="btn" type="button" onClick={add}>
        + افزودن بنر
      </button>
    </div>
  );
}

/* ── تنظیمات فروشگاه ── */

function SettingsTab({
  settings, real, onSave,
}: {
  settings: Settings;
  real: boolean;
  onSave: (s: Settings) => Promise<boolean>;
}) {
  const [f, setF] = useState({
    ann: settings.ann,
    phone: settings.phone,
    free: String(settings.free),
    shipPost: String(settings.shipPost),
    shipPeyk: String(settings.shipPeyk),
  });

  const save = async () => {
    const free = Number(dg(f.free));
    const post = Number(dg(f.shipPost));
    const peyk = Number(dg(f.shipPeyk));
    if (!free || !post || !peyk || !f.ann.trim()) {
      useUI.getState().say("همه مقادیر را درست وارد کنید");
      return;
    }
    const ok = await onSave({ ann: f.ann.trim(), phone: f.phone.trim(), free, shipPost: post, shipPeyk: peyk });
    if (!ok) return;
    useUI.getState().say("تنظیمات ذخیره شد ✓");
  };

  return (
    <>
      <div className="adm-top">
        <h1>تنظیمات فروشگاه</h1>
      </div>
      <div className="panel fm" style={{ maxWidth: 560 }}>
        <label>
          متن نوار اعلان بالای سایت
          <input value={f.ann} onChange={(e) => setF({ ...f, ann: e.target.value })} />
        </label>
        <label>
          تلفن فروشگاه
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </label>
        <label>
          سقف ارسال رایگان (تومان)
          <input value={f.free} onChange={(e) => setF({ ...f, free: e.target.value })} inputMode="numeric" />
        </label>
        <div className="two">
          <label>
            هزینه پست پیشتاز (تومان)
            <input value={f.shipPost} onChange={(e) => setF({ ...f, shipPost: e.target.value })} inputMode="numeric" />
          </label>
          <label>
            هزینه پیک همان‌روز (تومان)
            <input value={f.shipPeyk} onChange={(e) => setF({ ...f, shipPeyk: e.target.value })} inputMode="numeric" />
          </label>
        </div>
        <button className="btn" type="button" onClick={save}>
          ذخیره تنظیمات
        </button>
        <small style={{ color: "var(--mute)" }}>
          {real
            ? "ذخیره روی دیتابیس — در بارگذاری بعدی سایت برای همهٔ بازدیدکنندگان اعمال می‌شود (نوار اعلان، سبد خرید، تسویه‌حساب)."
            : "تغییرات بلافاصله در سایت اعمال می‌شود: نوار اعلان، سبد خرید، صفحه محصول و تسویه‌حساب."}
        </small>
      </div>
    </>
  );
}
