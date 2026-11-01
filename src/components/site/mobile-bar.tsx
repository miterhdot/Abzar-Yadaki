"use client";

import { useEffect } from "react";
import { useRoute, useUI } from "@/lib/shop-state";
import { CartBadge } from "./cart-drawer";

/** Mobile bottom tab bar + menu bottom-sheet — 1:1 from design */
export function MobileBar() {
  const page = useRoute((s) => s.page);
  const dr = useUI((s) => s.dr);
  const msh = useUI((s) => s.msh);
  const sheet = useUI((s) => s.sheet);

  const on = (h: string) => {
    const cur = page === "home" ? "#home" : page === "product" ? "prod" : `#${page}`;
    return cur === h ? "on" : "";
  };

  /* keyboard: Esc closes the menu sheet */
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") msh(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, msh]);

  return (
    <>
      <div className="tb" id="tb">
        <a href="#home" className={on("#home")}>
          <span>🏠</span>خانه
        </a>
        <a href="#cats" className={on("#cats")}>
          <span>🗂️</span>دسته‌ها
        </a>
        <a href="#offers" className={on("#offers")}>
          <span>🔥</span>تخفیف‌ها
        </a>
        <button type="button" onClick={() => dr(true)}>
          <span>🛒</span>سبد
          <CartBadge />
        </button>
        <button type="button" onClick={() => msh(true)}>
          <span>☰</span>منو
        </button>
      </div>
      <div className={"sh" + (sheet ? " open" : "")} id="sh" onClick={() => msh(false)}>
        <div className="shp" onClick={(e) => e.stopPropagation()}>
          <div className="shh">
            <b>منوی سایت</b>
            <button className="btn ghost" type="button" onClick={() => msh(false)}>
              ✕
            </button>
          </div>
          <div className="shl" onClick={() => msh(false)}>
            <a href="#home">🏠 صفحه اصلی</a>
            <a href="#shop">🛍️ همه محصولات</a>
            <a href="#cats">🗂️ دسته‌بندی‌ها</a>
            <a href="#offers">🔥 تخفیف‌ها</a>
            <a href="#auth">👤 ورود / ثبت‌نام</a>
            <a href="#account">📋 حساب من</a>
            <a href="#wishlist">❤️ علاقه‌مندی‌ها</a>
            <a href="#track">📦 پیگیری سفارش</a>
            <a href="#faq">❓ سوالات متداول</a>
            <a href="#about">ℹ️ درباره ما</a>
            <a href="#contact">📞 تماس با ما</a>
          </div>
        </div>
      </div>
    </>
  );
}

/** Design's .toast — fixed bottom center, navy */
export function Toast() {
  const toast = useUI((s) => s.toast);
  const toastId = useUI((s) => s.toastId);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useUI.setState({ toast: "" }), 3000);
    return () => clearTimeout(t);
  }, [toast, toastId]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}
