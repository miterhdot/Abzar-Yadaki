"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ADDRESSES, Address, BANNERS, Banner, COUPONS, Coupon, MSGS, Msg, Order, OrderStatus,
  P, Product, REVIEWS_QUEUE, Review, SETTINGS, Settings, ORDERS,
} from "@/data/store";

/* ─────────── Route (hash-based, same hashes as design) ─────────── */

export type Page =
  | "home" | "shop" | "product" | "cats" | "offers"
  | "about" | "contact" | "checkout" | "done"
  | "auth" | "account" | "track" | "wishlist"
  | "faq" | "terms" | "returns" | "privacy" | "cookies" | "refund"
  | "notfound" | "admin";

const PAGES: Page[] = [
  "shop", "cats", "offers", "about", "contact", "checkout", "done",
  "auth", "account", "track", "wishlist", "faq", "terms", "returns",
  "privacy", "cookies", "refund", "admin",
];

type GoOpts = { pid?: number; cat?: string; q?: string };

type RouteState = {
  page: Page;
  pid: number;
  cat: string;
  q: string;
  sort: string;
  lastOrder: string;
  go: (page: Page, opts?: GoOpts) => void;
  setFromHash: () => void;
  setSort: (s: string) => void;
};

export const hashOf = (page: Page, pid = 0): string =>
  page === "home" ? "#home" : page === "product" ? `#p-${pid}` : `#${page}`;

export const useRoute = create<RouteState>()((set) => ({
  page: "home",
  pid: 0,
  cat: "",
  q: "",
  sort: "",
  lastOrder: "",
  go: (page, opts) => {
    const pid = opts?.pid ?? 0;
    const h = hashOf(page, pid);
    set((st) => ({
      page,
      pid,
      cat: opts?.cat !== undefined ? opts.cat : st.cat,
      q: opts?.q !== undefined ? opts.q : "",
    }));
    if (window.location.hash !== h) {
      window.location.hash = h; // triggers hashchange → setFromHash + scroll top
    }
  },
  setFromHash: () => {
    const h = window.location.hash.slice(1) || "home";
    let page: Page = "home";
    let pid = 0;
    if (h === "home" || h === "") page = "home";
    else if (h === "shop") page = "shop";
    else if (h.startsWith("p-")) { page = "product"; pid = Number(h.slice(2)) || 0; }
    else if (PAGES.includes(h as Page)) page = h as Page;
    else page = "notfound";
    set({ page, pid });
    window.scrollTo(0, 0);
  },
  setSort: (s) => set({ sort: s }),
}));

/* ─────────── Cart (persisted) ─────────── */

export type CartLine = { id: number; n: number };

/* فهرست کالاهای حذف‌شده از سبد (دستور ۲۷) — با هر حذف ثبت و تا بازگرداندن/پاک‌سازی می‌ماند */
export type RemovedLine = { id: number; n: number };

/* دستهٔ «در حال بررسی» لیست انتظار (دستور ۲۸) — کالایی که کاربر از صفحه انتخاب کرده و روی آن شک دارد */
export type SavedLine = { id: number };

type CartState = {
  items: CartLine[];
  removed: RemovedLine[];
  saved: SavedLine[];
  add: (id: number, n?: number) => void;
  chg: (id: number, d: number) => void;
  clear: () => void;
  restore: (id: number) => void;
  purgeRemoved: (id: number) => void;
  clearRemoved: () => void;
  save: (id: number) => void;
  unsave: (id: number) => void;
  clearSaved: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      removed: [],
      saved: [],
      /* افزودن به سبد = خروج خودکار کالا از هر دو دستهٔ لیست انتظار (دستور ۲۸) */
      add: (id, n = 1) =>
        set((st) => {
          const line = st.items.find((x) => x.id === id);
          return line
            ? {
                items: st.items.map((x) => (x.id === id ? { ...x, n: x.n + n } : x)),
                removed: st.removed.filter((x) => x.id !== id),
                saved: st.saved.filter((x) => x.id !== id),
              }
            : {
                items: [...st.items, { id, n }],
                removed: st.removed.filter((x) => x.id !== id),
                saved: st.saved.filter((x) => x.id !== id),
              };
        }),
      chg: (id, d) =>
        set((st) => {
          const line = st.items.find((x) => x.id === id);
          if (!line) return {};
          const next = line.n + d;
          return next < 1
            ? {
                items: st.items.filter((x) => x.id !== id),
                removed: [{ id, n: line.n }, ...st.removed.filter((x) => x.id !== id)],
              }
            : { items: st.items.map((x) => (x.id === id ? { ...x, n: next } : x)) };
        }),
      clear: () => set({ items: [] }),
      restore: (id) =>
        set((st) => {
          const rm = st.removed.find((x) => x.id === id);
          if (!rm) return {};
          const line = st.items.find((x) => x.id === id);
          return {
            removed: st.removed.filter((x) => x.id !== id),
            items: line
              ? st.items.map((x) => (x.id === id ? { ...x, n: x.n + rm.n } : x))
              : [...st.items, { id, n: rm.n }],
          };
        }),
      purgeRemoved: (id) => set((st) => ({ removed: st.removed.filter((x) => x.id !== id) })),
      clearRemoved: () => set({ removed: [] }),
      /* دستهٔ «در حال بررسی» — کالای انتخاب‌شده با شک (دستور ۲۸) */
      save: (id) => set((st) => (st.saved.some((x) => x.id === id) ? {} : { saved: [{ id }, ...st.saved] })),
      unsave: (id) => set((st) => ({ saved: st.saved.filter((x) => x.id !== id) })),
      clearSaved: () => set({ saved: [] }),
    }),
    { name: "abzar-cart", skipHydration: true }
  )
);

export const cartCount = (items: CartLine[]): number =>
  items.reduce((a, x) => a + x.n, 0);

export const cartTotal = (items: CartLine[]): number =>
  items.reduce((a, x) => a + (findProduct(x.id)?.p ?? 0) * x.n, 0);

/* ─────────── Store data (admin-editable, persisted) ─────────── */

type DataState = {
  prods: Product[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  msgs: Msg[];
  banners: Banner[];
  addresses: Address[];
  users: { name: string; phone: string }[];
  settings: Settings;
  /* products */
  addProd: (p: Product) => void;
  updProd: (p: Product) => void;
  delProd: (id: number) => void;
  /* orders */
  addOrder: (o: Order) => void;
  setOrderStatus: (code: string, s: OrderStatus) => void;
  /* coupons */
  addCoupon: (c: Coupon) => void;
  toggleCoupon: (code: string) => void;
  delCoupon: (code: string) => void;
  /* reviews */
  addReview: (r: Review) => void;
  setReviewStatus: (id: number, s: Review["status"]) => void;
  delReview: (id: number) => void;
  /* messages */
  addMsg: (m: Msg) => void;
  readMsg: (id: number) => void;
  delMsg: (id: number) => void;
  /* banners */
  toggleBanner: (id: number) => void;
  addBanner: (b: Banner) => void;
  delBanner: (id: number) => void;
  /* addresses */
  addAddress: (a: Address) => void;
  delAddress: (id: number) => void;
  /* users + settings */
  upsertUser: (name: string, phone: string) => void;
  saveSettings: (s: Settings) => void;
};

export const useData = create<DataState>()(
  persist(
    (set) => ({
      prods: P,
      orders: ORDERS,
      coupons: COUPONS,
      reviews: REVIEWS_QUEUE,
      msgs: MSGS,
      banners: BANNERS,
      addresses: ADDRESSES,
      users: [
        { name: "علی رضایی", phone: "۰۹۱۲۳۴۵۶۷۸۹" },
        { name: "مریم کریمی", phone: "۰۹۳۵۱۱۲۲۳۳۴" },
        { name: "حسین محمدی", phone: "۰۹۱۹۸۷۶۵۴۳۲" },
      ],
      settings: SETTINGS,

      addProd: (p) => set((st) => ({ prods: [p, ...st.prods] })),
      updProd: (p) => set((st) => ({ prods: st.prods.map((x) => (x.id === p.id ? p : x)) })),
      delProd: (id) => set((st) => ({ prods: st.prods.filter((x) => x.id !== id) })),

      addOrder: (o) => set((st) => ({ orders: [o, ...st.orders] })),
      setOrderStatus: (code, s) =>
        set((st) => ({ orders: st.orders.map((o) => (o.code === code ? { ...o, status: s } : o)) })),

      addCoupon: (c) => set((st) => ({ coupons: [c, ...st.coupons] })),
      toggleCoupon: (code) =>
        set((st) => ({ coupons: st.coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c)) })),
      delCoupon: (code) => set((st) => ({ coupons: st.coupons.filter((c) => c.code !== code) })),

      addReview: (r) => set((st) => ({ reviews: [r, ...st.reviews] })),
      setReviewStatus: (id, s) =>
        set((st) => ({ reviews: st.reviews.map((r) => (r.id === id ? { ...r, status: s } : r)) })),
      delReview: (id) => set((st) => ({ reviews: st.reviews.filter((r) => r.id !== id) })),

      addMsg: (m) => set((st) => ({ msgs: [m, ...st.msgs] })),
      readMsg: (id) => set((st) => ({ msgs: st.msgs.map((m) => (m.id === id ? { ...m, unread: false } : m)) })),
      delMsg: (id) => set((st) => ({ msgs: st.msgs.filter((m) => m.id !== id) })),

      toggleBanner: (id) =>
        set((st) => ({ banners: st.banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b)) })),
      addBanner: (b) => set((st) => ({ banners: [...st.banners, b] })),
      delBanner: (id) => set((st) => ({ banners: st.banners.filter((b) => b.id !== id) })),

      addAddress: (a) => set((st) => ({ addresses: [...st.addresses, a] })),
      delAddress: (id) => set((st) => ({ addresses: st.addresses.filter((a) => a.id !== id) })),

      upsertUser: (name, phone) =>
        set((st) => ({
          users: st.users.some((u) => u.phone === phone)
            ? st.users.map((u) => (u.phone === phone ? { ...u, name } : u))
            : [...st.users, { name, phone }],
        })),

      saveSettings: (s) => set({ settings: s }),
    }),
    { name: "abzar-data", skipHydration: true }
  )
);

export const findProduct = (id: number): Product | undefined =>
  useData.getState().prods.find((y) => y.id === id);

/* ─────────── Auth (persisted) ─────────── */

export type User = { name: string; phone: string };

type AuthState = {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "abzar-user", skipHydration: true }
  )
);

/* ─────────── Wishlist (persisted) ─────────── */

type WishState = {
  ids: number[];
  toggle: (id: number) => boolean; // returns true if now wished
};

export const useWish = create<WishState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => {
        let now = false;
        set((st) => {
          const has = st.ids.includes(id);
          now = !has;
          return { ids: has ? st.ids.filter((x) => x !== id) : [id, ...st.ids] };
        });
        return now;
      },
    }),
    { name: "abzar-wish", skipHydration: true }
  )
);

/* ─────────── Admin session (per tab) ─────────── */

type AdminState = { logged: boolean; login: () => void; logout: () => void };

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      logged: false,
      login: () => set({ logged: true }),
      logout: () => set({ logged: false }),
    }),
    { name: "abzar-admin", skipHydration: true, storage: createJSONStorage(() => sessionStorage) }
  )
);

/* rehydrate every persisted store after mount (avoids SSR mismatch) */
export const rehydrateAll = () => {
  [useCart, useData, useAuth, useWish, useAdmin].forEach((s) => s.persist.rehydrate());
};

/* ─────────── UI (drawer / sheet / toast) ─────────── */

type UIState = {
  drawer: boolean;
  sheet: boolean;
  rdrw: boolean; /* کشوی «لیست کالای حذف‌شده» (دستور ۲۷) */
  toast: string;
  toastId: number;
  dr: (open: boolean) => void;
  msh: (open: boolean) => void;
  rdr: (open: boolean) => void;
  say: (msg: string) => void;
};

export const useUI = create<UIState>()((set) => ({
  drawer: false,
  sheet: false,
  rdrw: false,
  toast: "",
  toastId: 0,
  dr: (open) => set({ drawer: open }),
  msh: (open) => set({ sheet: open }),
  rdr: (open) => set({ rdrw: open }),
  say: (msg) => set((st) => ({ toast: msg, toastId: st.toastId + 1 })),
}));

/* ─────────── Recently viewed (session, like design) ─────────── */

type RVState = { rv: number[]; push: (id: number) => void };

export const useRV = create<RVState>()((set) => ({
  rv: [],
  push: (id) =>
    set((st) => ({ rv: [id, ...st.rv.filter((x) => x !== id)].slice(0, 4) })),
}));
