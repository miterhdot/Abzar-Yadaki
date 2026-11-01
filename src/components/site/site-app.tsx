"use client";

import { useEffect } from "react";
import { rehydrateAll, useCart, useRoute } from "@/lib/shop-state";
import { AnnBar, Footer, Header } from "./chrome";
import { CartDrawer } from "./cart-drawer";
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
import { FaqView, TermsView, ReturnsView } from "./views/static";
import { NotFoundView } from "./views/notfound";
import { AdminApp } from "./admin/admin-app";

export default function SiteApp() {
  const page = useRoute((s) => s.page);
  const pid = useRoute((s) => s.pid);
  const setFromHash = useRoute((s) => s.setFromHash);

  /* hydrate persisted stores after mount (avoids SSR mismatch) */
  useEffect(() => {
    rehydrateAll();
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
      useRoute.setState({ q: "" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* design's body[data-pg] for mobile horizontal product rails */
  useEffect(() => {
    document.body.dataset.pg = page === "product" ? "prod" : page;
  }, [page]);

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
        {page === "notfound" && <NotFoundView />}
      </main>
      <Footer />
      <CartDrawer />
      <MobileBar />
      <Toast />
    </>
  );
}
