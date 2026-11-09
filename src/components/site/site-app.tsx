"use client";

import { useEffect, useSyncExternalStore } from "react";
import { rehydrateAll, useCart, useData, useRoute } from "@/lib/shop-state";
import { dbFetchCatalog } from "@/lib/supabase";
import MobileApp from "@/mobile/MobileApp";
import { AnnBar, Footer, Header } from "./chrome";
import { CartDrawer, WaitingDrawer } from "./cart-drawer";
import { MobileBar, Toast } from "./mobile-bar";
import { HomeView } from "./views/home";
import { ShopView } from "./views/shop";
import { ProductPage } from "./views/product";
import { CatsView } from "./views/cats";
import { OffersView } from "./views/offers";
import { AboutView } from "./views/about";
import { ContactView } from "./views/contact";
import { CheckoutView, DoneView } from "./views/checkout";
import { AuthView } from "./views/auth";
import { AccountView } from "./views/account";
import { TrackView } from "./views/track";
import { WishlistView } from "./views/wishlist";
import { FaqView, TermsView, PrivacyView, CookiesView, RefundView, ReturnsView } from "./views/static";
import { NotFoundView } from "./views/notfound";
import { AdminApp } from "./admin/admin-app";

/* ─────────── اپلیکیشن موبایل (دستور ۱۵) — نقطه اتصال واحد ───────────
   ۱) هر مسیر #app-* روی هر نمایشگری → اپ (در دسکتاپ مثل قاب گوشی وسط صفحه — خودِ طراحی)
   ۲) روی نمایشگر تلفن (≤۷۶۷px) → اپ به‌جای وب، به‌جز مسیرهای WEB_KEEP که همان نمای وب می‌مانند
      (تسویه‌حساب، ادمین، حساب، علاقه‌مندی‌ها، صفحات ثابت و...) — سیم‌کشی واقعی بدون ساخت نمای تکراری */

const useIsPhone = (): boolean =>
  useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );

const useHash = (): string =>
  useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash,
    () => ""
  );

/* مسیرهای وب که روی موبایل هم به‌صورت وب می‌مانند (خارج از گرافیک اپ) */
const WEB_KEEP =
  /^#(admin|checkout|done|offers|about|contact|auth|account|track|wishlist|faq|terms|returns|privacy|cookies|refund|notfound)$/;

export default function SiteApp() {
  const page = useRoute((s) => s.page);
  const pid = useRoute((s) => s.pid);
  const setFromHash = useRoute((s) => s.setFromHash);
  const isPhone = useIsPhone();
  const hash = useHash();

  /* hydrate persisted stores after mount (avoids SSR mismatch) */
  useEffect(() => {
    rehydrateAll();
  }, []);

  /* فاز D3 (دستور ۲۵): کاتالوگ واقعی از دیتابیس — محصولات/بنرها/تنظیمات/نظراتِ تأییدشده.
     fail-soft: در نبود اتصال، کاتالوگ کد مصوب (مصوبه ۱۰) باقی می‌ماند؛
     خالی‌بودن محصولات در دیتابیس هم کاتالوگ را خالی نمی‌کند (ضد خالی‌شدن فروشگاه). */
  useEffect(() => {
    (async () => {
      const cat = await dbFetchCatalog();
      if (!cat) return;
      useData.setState({
        ...(cat.prods.length ? { prods: cat.prods } : {}),
        ...(cat.banners.length ? { banners: cat.banners } : {}),
        ...(cat.settings ? { settings: cat.settings } : {}),
        reviews: cat.reviews,
      });
    })();
  }, []);

  /* hash router sync + initial */
  useEffect(() => {
    setFromHash();
    const onHash = () => setFromHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [setFromHash]);

  /* design's global click rule: any #anchor click resets the search query */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href^='#']");
      if (!a) return;
      /* استثنا (دستور ۲۹): لینک‌های دارای data-keepq — پیش‌پُر کردن کد پیگیری — از پاک‌شدن q معاف‌اند؛
         وگرنه رویداد جهانی بعد از onClick خودِ لینک، q را خالی می‌کرد و فرم پیگیری خالی باز می‌شد */
      if (a.closest("[data-keepq]")) return;
      useRoute.setState({ q: "" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* design's body[data-pg] for mobile horizontal product rails */
  useEffect(() => {
    document.body.dataset.pg = page === "product" ? "prod" : page;
  }, [page]);

  /* اپلیکیشن موبایل: مسیر اختصاصی #app-* یا نمایشگر تلفن (به‌جز مسیرهای وبِ حفظ‌شده) —
     بعد از همه هوک‌ها تا قانون هوک‌های ری‌اکت حفظ شود */
  const appActive = hash.startsWith("#app") || (isPhone && !WEB_KEEP.test(hash || "#home"));
  if (appActive) {
    return <MobileApp />;
  }

  if (page === "admin") {
    return (
      <>
        <AdminApp />
        <Toast />
      </>
    );
  }

  return (
    <>
      <AnnBar />
      <Header />
      <main>
        {page === "home" && <HomeView key="home" />}
        {page === "shop" && <ShopView key={`shop-${useRoute.getState().cat}-${useRoute.getState().q}`} />}
        {page === "product" && <ProductPage key={`p-${pid}`} id={pid} />}
        {page === "cats" && <CatsView />}
        {page === "offers" && <OffersView />}
        {page === "about" && <AboutView />}
        {page === "contact" && <ContactView />}
        {page === "checkout" && <CheckoutView />}
        {page === "done" && <DoneView />}
        {page === "auth" && <AuthView />}
        {page === "account" && <AccountView />}
        {page === "track" && <TrackView />}
        {page === "wishlist" && <WishlistView />}
        {page === "faq" && <FaqView />}
        {page === "terms" && <TermsView />}
        {page === "returns" && <ReturnsView />}
        {page === "privacy" && <PrivacyView />}
        {page === "cookies" && <CookiesView />}
        {page === "refund" && <RefundView />}
        {page === "notfound" && <NotFoundView />}
      </main>
      <Footer />
      <CartDrawer />
      <WaitingDrawer />
      <MobileBar />
      <Toast />
    </>
  );
}
