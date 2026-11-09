/* آیکون‌های اپلیکیشن موبایل — پرت ۱:۱ از گرافیک آپلودشده مدیر (دستور ۱۵) */

import type { JSX } from "react";
import type { Product } from "@/data/store";

/* کلید آیکون دسته‌ها — دقیقاً مطابق IC/CK فایل طراحی */
export type IconKey = "f" | "b" | "o" | "e" | "t" | "c";

export const CK: Record<string, IconKey> = {
  فیلتر: "f",
  ترمز: "b",
  روغن: "o",
  برق: "e",
  ابزار: "t",
  بدنه: "c",
};

const IC: Record<IconKey, JSX.Element> = {
  f: (
    <>
      <rect x="7" y="4" width="10" height="16" rx="3" />
      <path d="M7 9h10M7 15h10" />
    </>
  ),
  b: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" />
    </>
  ),
  o: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  e: <path d="M13 2L5 14h6l-1 8 8-12h-6z" />,
  t: (
    <path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z" />
  ),
  c: (
    <>
      <path d="M4 15l1.5-5A2 2 0 0 1 7.4 8.5h9.2a2 2 0 0 1 1.9 1.5L20 15v3H4z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
};

export const Ci = ({ k, s = 30 }: { k: IconKey; s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s}>
    {IC[k]}
  </svg>
);

/* آیکون کاشی محصول = آیکون دسته (مطابق ic(p) طراحی) */
export const PIcon = ({ p, s = 52 }: { p: Product; s?: number }) => (
  <Ci k={CK[p.c] ?? "t"} s={s} />
);

/* لوگوی شش‌ضلعی — عیناً از فایل طراحی (ویژگی‌های fill/stroke روی فرزندها حفظ شده) */
export const LogoM = () => (
  <svg viewBox="0 0 48 48">
    <rect width="48" height="48" rx="13" fill="#143a66" />
    <rect x=".75" y=".75" width="46.5" height="46.5" rx="12.5" fill="none" stroke="#3b78c0" strokeWidth="1.5" />
    <polygon points="24,7 38.5,15.5 38.5,32.5 24,41 9.5,32.5 9.5,15.5" fill="#0b1f3a" />
    <polygon points="24,12.5 33.8,18.2 33.8,29.8 24,35.5 14.2,29.8 14.2,18.2" fill="none" stroke="#ffb703" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="5.5" fill="#ffb703" />
    <circle cx="24" cy="24" r="2.2" fill="#0b1f3a" />
  </svg>
);

/* آیکون‌های نوار پایین — عیناً از فایل طراحی */
export const TabHome = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const TabCats = () => (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);

export const TabCart = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 4h2l2.4 11h10.2l2-8H6.5" />
    <circle cx="9" cy="19" r="1.6" />
    <circle cx="17" cy="19" r="1.6" />
  </svg>
);

export const TabMe = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </svg>
);

/* آیکون سطل زباله — «لیست کالای حذف‌شده» (دستور ۲۷) — هم‌سبک با آیکون‌های تپ‌بار */
export const TabRm = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

/* آیکون واتساپ — عیناً از فایل طراحی */
export const WaIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.6z" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z" />
  </svg>
);

/* آیکون درخشان دستیار هوش مصنوعی — عیناً از فایل طراحی (fill=currentColor) */
export const AiIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2l2 6.2L20.5 10 14 12l-2 6.2L10 12 3.5 10 10 8.2z" />
    <path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" />
  </svg>
);
