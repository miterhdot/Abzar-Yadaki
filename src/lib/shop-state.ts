"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { P, Product } from "@/data/store";

/* ─────────── Route (hash-based, same hashes as design) ─────────── */

export type Page =
  | "home" | "shop" | "product" | "cats" | "offers"
  | "about" | "contact" | "checkout" | "done" | "admin";

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
    if (h === "shop") page = "shop";
    else if (h.startsWith("p-")) { page = "product"; pid = Number(h.slice(2)) || 0; }
    else if (["cats", "offers", "about", "contact", "checkout", "done", "admin"].includes(h)) {
      page = h as Page;
    }
    set({ page, pid });
    window.scrollTo(0, 0);
  },
  setSort: (s) => set({ sort: s }),
}));

/* ─────────── Cart (persisted) ─────────── */

export type CartLine = { id: number; n: number };

type CartState = {
  items: CartLine[];
  add: (id: number, n?: number) => void;
  chg: (id: number, d: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (id, n = 1) =>
        set((st) => {
          const line = st.items.find((x) => x.id === id);
          return line
            ? { items: st.items.map((x) => (x.id === id ? { ...x, n: x.n + n } : x)) }
            : { items: [...st.items, { id, n }] };
        }),
      chg: (id, d) =>
        set((st) => {
          const line = st.items.find((x) => x.id === id);
          if (!line) return {};
          const next = line.n + d;
          return next < 1
            ? { items: st.items.filter((x) => x.id !== id) }
            : { items: st.items.map((x) => (x.id === id ? { ...x, n: next } : x)) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "abzar-cart", skipHydration: true }
  )
);

export const cartCount = (items: CartLine[]): number =>
  items.reduce((a, x) => a + x.n, 0);

export const cartTotal = (items: CartLine[]): number =>
  items.reduce((a, x) => a + (P.find((y) => y.id === x.id)?.p ?? 0) * x.n, 0);

export const findProduct = (id: number): Product | undefined => P.find((y) => y.id === id);

/* ─────────── UI (drawer / sheet / toast) ─────────── */

type UIState = {
  drawer: boolean;
  sheet: boolean;
  toast: string;
  toastId: number;
  dr: (open: boolean) => void;
  msh: (open: boolean) => void;
  say: (msg: string) => void;
};

export const useUI = create<UIState>()((set) => ({
  drawer: false,
  sheet: false,
  toast: "",
  toastId: 0,
  dr: (open) => set({ drawer: open }),
  msh: (open) => set({ sheet: open }),
  say: (msg) => set((st) => ({ toast: msg, toastId: st.toastId + 1 })),
}));

/* ─────────── Recently viewed (session, like design) ─────────── */

type RVState = { rv: number[]; push: (id: number) => void };

export const useRV = create<RVState>()((set) => ({
  rv: [],
  push: (id) =>
    set((st) => ({ rv: [id, ...st.rv.filter((x) => x !== id)].slice(0, 4) })),
}));
