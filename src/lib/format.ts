/** Helpers — exactly as the design's F(), dg(), pd() */

export const F = (n: number): string => Number(n).toLocaleString("fa-IR");

/** Persian digits → Latin digits */
export const dg = (s: string): string =>
  String(s).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

/** pad(2) + Persian digits */
export const pd = (v: number): string =>
  String(v).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
