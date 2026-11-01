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

export type OrderLine = [number, number]; // [productId, qty]

export type Order = {
  code: string;
  name: string;
  phone: string;
  items: number;
  total: number;
  status: OrderStatus;
  day: number; // days ago
  lines?: OrderLine[];
  addr?: string;
  pay?: string; // online | cod
  ship?: string; // post | peyk
};

export const ORDERS: Order[] = [
  { code: "AY-K3M9X2", name: "علی رضایی", phone: "۰۹۱۲۳۴۵۶۷۸۹", items: 3, total: 3215000, status: "processing", day: 0, lines: [[1, 2], [4, 1], [11, 1]], addr: "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۱۲", pay: "online", ship: "post" },
  { code: "AY-B7T2Q4", name: "مریم کریمی", phone: "۰۹۳۵۱۱۲۲۳۳۴", items: 2, total: 1640000, status: "sent", day: 0, lines: [[7, 2], [11, 1]], addr: "شیراز، بلوار زند، ساختمان نور، طبقه ۳", pay: "online", ship: "post" },
  { code: "AY-Z8N1L5", name: "حسین محمدی", phone: "۰۹۱۹۸۷۶۵۴۳۲", items: 1, total: 3950000, status: "done", day: 1, lines: [[9, 1]], addr: "اصفهان، خیابان چهارباغ، پلاک ۸", pay: "cod", ship: "post" },
  { code: "AY-P4W6R8", name: "زهرا احمدی", phone: "۰۹۰۲۳۳۴۴۵۵۶", items: 5, total: 5480000, status: "done", day: 1, lines: [[5, 1], [16, 1], [12, 1], [13, 1], [3, 1]], addr: "کرج، مهرشهر، بلوار ارم، پلاک ۴۵", pay: "online", ship: "peyk" },
  { code: "AY-Q9J3K7", name: "رضا قاسمی", phone: "۰۹۱۲۷۷۸۸۹۹۰", items: 2, total: 2140000, status: "sent", day: 2, lines: [[12, 2], [13, 1]], addr: "تبریز، خیابان امام، کوچه سعد، پلاک ۹", pay: "online", ship: "post" },
  { code: "AY-M2V8C5", name: "سارا موسوی", phone: "۰۹۳۳۱۲۳۴۵۶۷", items: 1, total: 890000, status: "canceled", day: 3, lines: [[12, 1]], addr: "تهران، سعادت‌آباد، میدان کاج، پلاک ۲", pay: "online", ship: "post" },
  { code: "AY-D5F7G2", name: "امیر حسینی", phone: "۰۹۱۰۴۵۶۷۸۹۱", items: 4, total: 4360000, status: "done", day: 4, lines: [[15, 1], [9, 1], [4, 1], [2, 1]], addr: "مشهد، بلوار وکیل‌آباد، پلاک ۳۳", pay: "online", ship: "post" },
  { code: "AY-S6H1J9", name: "فاطمه نوری", phone: "۰۹۲۱۸۷۶۵۴۳۲", items: 2, total: 1440000, status: "done", day: 5, lines: [[1, 2], [7, 2]], addr: "تهران، نارمک، خیابان گلستان، پلاک ۷", pay: "cod", ship: "peyk" },
  { code: "AY-T3K8L4", name: "مهدی صادقی", phone: "۰۹۳۶۶۵۵۴۴۳۳", items: 3, total: 2610000, status: "done", day: 6, lines: [[11, 3], [7, 3], [1, 3]], addr: "قم، خیابان ۱۹ دی، پلاک ۱۴", pay: "online", ship: "post" },
  { code: "AY-N7P2Q6", name: "نگار جعفری", phone: "۰۹۱۲۹۹۸۸۷۷۶", items: 1, total: 2350000, status: "canceled", day: 7, lines: [[5, 1]], addr: "رشت، خیابان مطهری، پلاک ۲۱", pay: "online", ship: "post" },
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

/** فروش ۶ ماه اخیر (میلیون تومان) — گزارش‌ها */
export const MONTH_SALES: [string, number][] = [
  ["خرداد", 148], ["تیر", 165], ["مرداد", 151], ["شهریور", 189], ["مهر", 204], ["آبان", 232],
];

/* ── داده‌های نمایشی صفحات جدید (حساب، پیگیری، ادمین) ── */

export type Coupon = { code: string; percent: number; max: number; active: boolean };

export const COUPONS: Coupon[] = [
  { code: "WELCOME", percent: 10, max: 500000, active: true },
  { code: "ABZAR20", percent: 20, max: 1000000, active: true },
  { code: "OLDBOY5", percent: 5, max: 200000, active: false },
];

export type Review = { id: number; pid: number; name: string; text: string; r: string; status: "pending" | "ok" | "no" };

export const REVIEWS_QUEUE: Review[] = [
  { id: 1, pid: 1, name: "علی ر.", text: "فیلتر اصل بود، روی پراید ۹۴ کاملاً جفت شد.", r: "۵", status: "ok" },
  { id: 2, pid: 1, name: "مجید ت.", text: "بسته‌بندی خوب، قیمت هم مناسب‌تر از بازار.", r: "۴", status: "ok" },
  { id: 3, pid: 2, name: "سمیرا ن.", text: "لنت‌ها بی‌صدا و بدون صدا دادن ترمز می‌گیرند.", r: "۵", status: "ok" },
  { id: 4, pid: 5, name: "کاوه ش.", text: "کیفیت آچارها عالیه، کیفش هم محکمه.", r: "۵", status: "pending" },
  { id: 5, pid: 9, name: "نادر ف.", text: "باتری رو ۴ ماه استفاده کردم، راضی‌ام.", r: "۴", status: "pending" },
];

export type Msg = { id: number; name: string; phone: string; subject: string; text: string; unread: boolean; day: number };

export const MSGS: Msg[] = [
  { id: 1, name: "حسین محمدی", phone: "۰۹۱۹۸۷۶۵۴۳۲", subject: "پیگیری سفارش", text: "سلام، سفارش AY-Z8N1L5 کِی ارسال می‌شه؟", unread: true, day: 0 },
  { id: 2, name: "رضا قاسمی", phone: "۰۹۱۲۷۷۸۸۹۹۰", subject: "انتخاب قطعه مناسب خودرو", text: "برای ۴۰۵ مدل ۹۰ کدوم شمع بهتره؟", unread: true, day: 0 },
  { id: 3, name: "سارا موسوی", phone: "۰۹۳۳۱۲۳۴۵۶۷", subject: "مرجوعی و گارانتی", text: "پمپ باد مشکل داشت، مرجوع کردم. کی هزینه برمی‌گرده؟", unread: false, day: 1 },
  { id: 4, name: "امیر حسینی", phone: "۰۹۱۰۴۵۶۷۸۹۱", subject: "همکاری عمده", text: "برای تعمیرگاه قیمت عمده می‌دید؟", unread: false, day: 2 },
];

export type Banner = { id: number; t: string; d: string; href: string; bg: string; active: boolean };

export const BANNERS: Banner[] = [
  { id: 1, t: "⚡ تخفیف ویژه امروز", d: "قطعات منتخب با قیمت شگفت‌انگیز", href: "#offers", bg: "linear-gradient(135deg,#ff6a1a,#c2410c)", active: true },
  { id: 2, t: "🔧 ابزار حرفه‌ای", d: "آچار، جک و تجهیزات کارگاهی", href: "#cats", bg: "linear-gradient(135deg,#143a66,#0b1f3a)", active: true },
];

export type Address = { id: number; phone: string; title: string; text: string };

export const ADDRESSES: Address[] = [
  { id: 1, phone: "۰۹۱۲۳۴۵۶۷۸۹", title: "خانه", text: "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۱۲، واحد ۳" },
  { id: 2, phone: "۰۹۱۲۳۴۵۶۷۸۹", title: "محل کار", text: "تهران، میدان آزادی، مجتمع فنی آریا، پلاک ۴" },
];

export type Settings = typeof SETTINGS;

export const SETTINGS = {
  ann: "ارسال رایگان برای خرید بالای ۳ میلیون تومان · ضمانت اصالت کالا",
  phone: "۰۲۱-۰۰۰۰۰۰۰۰ (نمونه)",
  free: FREE,
  shipPost: 80000,
  shipPeyk: 120000,
};

export const FAQS: [string, string][] = [
  ["چطور قطعه‌ی سازگار با خودروی خود را پیدا کنم؟", "از انتخاب برند، مدل و سال ساخت در جعبه‌ی نارنجی صفحه اصلی استفاده کنید؛ فقط قطعه‌های سازگار نمایش داده می‌شوند. اگر شک دارید، قبل از خرید با پشتیبانی فنی تماس بگیرید."],
  ["سفارش چه زمانی ارسال می‌شود؟", "سفارش‌های ثبت‌شده تا ساعت ۱۴، همان روز کاری پردازش و ارسال می‌شوند. سفارش‌های بعد از ظهر روز کاری بعد ارسال می‌شوند."],
  ["هزینه و زمان ارسال چقدر است؟", "پست پیشتاز ۸۰ هزار تومان و پیک همان‌روز تهران ۱۲۰ هزار تومان است. برای سفارش‌های بالای ۳ میلیون تومان ارسال رایگان است."],
  ["کالا را می‌توانم مرجوع کنم؟", "بله؛ تا ۷ روز پس از تحویل، با سالم بودن بسته‌بندی و کارکرد نکردن قطعه، طبق «رویه بازگرداندن کالا» مرجوع می‌شود."],
  ["اصالت قطعه‌ها چطور تضمین می‌شود؟", "هر قطعه با فاکتور رسمی و کد رهگیری ارسال می‌شود و منبع تأمین همه برندها بررسی شده است."],
  ["پرداخت در محل دارید؟", "بله، علاوه بر درگاه امن بانکی، پرداخت در محل برای تهران و شهرستان‌ها فعال است."],
];
