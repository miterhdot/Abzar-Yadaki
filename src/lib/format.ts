/** Helpers — exactly as the design's F(), dg(), pd() */

export const F = (n: number): string => Number(n).toLocaleString("fa-IR");

/** Persian digits → Latin digits */
export const dg = (s: string): string =>
  String(s).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** pad(2) + Persian digits */
export const pd = (v: number): string =>
  String(v).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** Latin digits → Persian digits (no separators — for phone/OTP) */
export const fa = (s: string | number): string =>
  String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** نرمال‌سازی متن فارسی برای جستجو (A1 — دستور ۳۲): ي/ی، ك/ک، أإآ→ا، ة→ه،
 *  ارقام فارسی/عربی→لاتین، نیم‌فاصله/تطویل→فاصله، فاصله‌های اضافی، حروف کوچک لاتین */
export const normFa = (s: string): string =>
  String(s)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\u06F0-\u06F9]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\u200C/g, " ") /* نیم‌فاصله → فاصله (مرز واژه) */
    .replace(/\u0640/g, "") /* تطویل (کشیدگی درون‌واژه) → حذف */
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
