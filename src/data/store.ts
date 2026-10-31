/* ── Data — exactly as in the approved design ── */

export type Product = {
  id: number;
  n: string; // name
  c: string; // category
  e: string; // emoji
  p: number; // price (Toman)
  o: number; // old price (0 = none)
  b: string; // brand
  s: number; // 1 = موجود · ارسال امروز , 0 = موجود در انبار
  r: string; // rating (Persian)
};

export const P: Product[] = [
  { id: 1, n: "فیلتر روغن پراید و تیبا", c: "فیلتر", e: "🛢️", p: 185000, o: 220000, b: "سایپا یدک", s: 1, r: "۴٫۸" },
  { id: 2, n: "لنت ترمز جلو پژو ۲۰۶", c: "ترمز", e: "🛑", p: 690000, o: 790000, b: "بوش", s: 1, r: "۴٫۹" },
  { id: 3, n: "روغن موتور ۵W-30 چهار لیتری", c: "روغن", e: "🧴", p: 1450000, o: 0, b: "ایرانول", s: 0, r: "۴٫۷" },
  { id: 4, n: "شمع موتور سوزنی (ست ۴ تایی)", c: "برق", e: "⚡", p: 540000, o: 620000, b: "NGK", s: 1, r: "۴٫۸" },
  { id: 5, n: "ست آچار بکس ۴۶ عددی", c: "ابزار", e: "🔧", p: 2350000, o: 2900000, b: "رونیکس", s: 1, r: "۴٫۶" },
  { id: 6, n: "تیغه برف‌پاک‌کن سیلیکونی", c: "بدنه", e: "🌧️", p: 320000, o: 0, b: "بوش", s: 0, r: "۴٫۵" },
  { id: 7, n: "فیلتر هوا ۲۰۶ تیپ ۲", c: "فیلتر", e: "💨", p: 260000, o: 310000, b: "مان", s: 1, r: "۴٫۷" },
  { id: 8, n: "جک روغنی ۲ تن", c: "ابزار", e: "🏗️", p: 3100000, o: 0, b: "توسن", s: 0, r: "۴٫۴" },
  { id: 9, n: "باتری ۶۰ آمپر", c: "برق", e: "🔋", p: 3950000, o: 4400000, b: "سپاهان", s: 1, r: "۴٫۶" },
  { id: 10, n: "دیسک ترمز جلو سمند", c: "ترمز", e: "💿", p: 1250000, o: 0, b: "بوش", s: 0, r: "۴٫۷" },
  { id: 11, n: "فیلتر کابین ضدحساسیت", c: "فیلتر", e: "🌬️", p: 210000, o: 250000, b: "مان", s: 1, r: "۴٫۵" },
  { id: 12, n: "پمپ باد فندکی ۱۲ ولت", c: "ابزار", e: "🎈", p: 890000, o: 1050000, b: "توسن", s: 1, r: "۴٫۴" },
  { id: 13, n: "اسپری گریس و روان‌کننده", c: "روغن", e: "🧪", p: 140000, o: 0, b: "WD-40", s: 0, r: "۴٫۸" },
  { id: 14, n: "کاور ضدآب خودرو", c: "بدنه", e: "🚗", p: 760000, o: 0, b: "پارس", s: 0, r: "۴٫۳" },
  { id: 15, n: "چراغ مه‌شکن LED", c: "برق", e: "💡", p: 1380000, o: 1600000, b: "اسرام", s: 1, r: "۴٫۶" },
  { id: 16, n: "جعبه‌ابزار ۳ طبقه", c: "ابزار", e: "🧰", p: 1950000, o: 0, b: "رونیکس", s: 0, r: "۴٫۵" },
];

/** [emoji, name] — exactly as design */
export const C: [string, string][] = [
  ["🛢️", "فیلتر"],
  ["🛑", "ترمز"],
  ["🧴", "روغن"],
  ["⚡", "برق"],
  ["🔧", "ابزار"],
  ["🌧️", "بدنه"],
];

export const FREE = 3_000_000;

export const TRUST: [string, string, string][] = [
  ["🛡️", "ضمانت اصالت", "کد رهگیری هر قطعه"],
  ["🚚", "ارسال سریع", "تهران همان روز"],
  ["↩️", "۷ روز بازگشت", "بدون سوال"],
  ["💳", "پرداخت امن", "درگاه شاپرک"],
];

export const WHY: [string, string, string][] = [
  ["🛡️", "اصالت تضمینی", "کد رهگیری و فاکتور رسمی برای هر قطعه"],
  ["🎯", "انتخاب بدون اشتباه", "با انتخاب خودرو فقط قطعه سازگار می‌بینید"],
  ["🚚", "ارسال سریع", "همان‌روز در شهر، پست پیشتاز به سراسر کشور"],
  ["💬", "پشتیبانی فنی", "مشاوره‌ی انتخاب قطعه پیش از خرید"],
];

export const REVIEWS: [string, string][] = [
  ["علی ر.", "قطعه اصل بود و سریع رسید."],
  ["مریم ک.", "با انتخاب خودرو دقیقاً قطعه‌ی درست را پیدا کردم."],
  ["حسین م.", "پشتیبانی خوب جواب داد."],
];

export const FIT = {
  brand: ["پژو", "سمند", "پراید", "دنا"],
  model: ["۲۰۶", "۴۰۵", "تیبا"],
  year: ["۱۴۰۴", "۱۴۰۳", "۱۴۰۲"],
};

/* ── Admin demo data (separate from the site design) ── */

export type OrderStatus = "processing" | "sent" | "done" | "canceled";

export type Order = {
  code: string;
  name: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  day: number; // days ago
};

export const ORDERS: Order[] = [
  { code: "AY-K3M9X2", name: "علی رضایی", phone: "۰۹۱۲۳۴۵۶۷۸۹", items: 3, total: 3215000, status: "processing", day: 0 },
  { code: "AY-B7T2Q4", name: "مریم کریمی", phone: "۰۹۳۵۱۱۲۲۳۳۴", items: 2, total: 1640000, status: "sent", day: 0 },
  { code: "AY-Z8N1L5", name: "حسین محمدی", phone: "۰۹۱۹۸۷۶۵۴۳۲", items: 1, total: 3950000, status: "done", day: 1 },
  { code: "AY-P4W6R8", name: "زهرا احمدی", phone: "۰۹۰۲۳۳۴۴۵۵۶", items: 5, total: 5480000, status: "done", day: 1 },
  { code: "AY-Q9J3K7", name: "رضا قاسمی", phone: "۰۹۱۲۷۷۸۸۹۹۰", items: 2, total: 2140000, status: "sent", day: 2 },
  { code: "AY-M2V8C5", name: "سارا موسوی", phone: "۰۹۳۳۱۲۳۴۵۶۷", items: 1, total: 890000, status: "canceled", day: 3 },
  { code: "AY-D5F7G2", name: "امیر حسینی", phone: "۰۹۱۰۴۵۶۷۸۹۱", items: 4, total: 4360000, status: "done", day: 4 },
  { code: "AY-S6H1J9", name: "فاطمه نوری", phone: "۰۹۲۱۸۷۶۵۴۳۲", items: 2, total: 1440000, status: "done", day: 5 },
  { code: "AY-T3K8L4", name: "مهدی صادقی", phone: "۰۹۳۶۶۵۵۴۴۳۳", items: 3, total: 2610000, status: "done", day: 6 },
  { code: "AY-N7P2Q6", name: "نگار جعفری", phone: "۰۹۱۲۹۹۸۸۷۷۶", items: 1, total: 2350000, status: "canceled", day: 7 },
];

export const STATUS_FA: Record<OrderStatus, string> = {
  processing: "در حال پردازش",
  sent: "ارسال شده",
  done: "تحویل شده",
  canceled: "لغو شده",
};

export type Customer = {
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  last: string;
};

export const CUSTOMERS: Customer[] = [
  { name: "علی رضایی", phone: "۰۹۱۲۳۴۵۶۷۸۹", city: "تهران", orders: 12, spent: 18350000, last: "امروز" },
  { name: "زهرا احمدی", phone: "۰۹۰۲۳۳۴۴۵۵۶", city: "کرج", orders: 8, spent: 14260000, last: "دیروز" },
  { name: "حسین محمدی", phone: "۰۹۱۹۸۷۶۵۴۳۲", city: "اصفهان", orders: 6, spent: 9840000, last: "دیروز" },
  { name: "مریم کریمی", phone: "۰۹۳۵۱۱۲۲۳۳۴", city: "شیراز", orders: 5, spent: 7620000, last: "امروز" },
  { name: "امیر حسینی", phone: "۰۹۱۰۴۵۶۷۸۹۱", city: "مشهد", orders: 4, spent: 6330000, last: "۴ روز پیش" },
  { name: "رضا قاسمی", phone: "۰۹۱۲۷۷۸۸۹۹۰", city: "تبریز", orders: 3, spent: 4490000, last: "۲ روز پیش" },
];

/** آخرین ۷ روز — فروش به میلیون تومان */
export const WEEK_SALES: [string, number][] = [
  ["ش", 8.2], ["ی", 9.1], ["د", 7.4], ["س", 10.3], ["چ", 11.8], ["پ", 9.6], ["ج", 12.45],
];
