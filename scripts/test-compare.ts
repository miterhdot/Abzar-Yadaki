/* دستور ۴۲ (M1) — تست منطق استور مقایسه (اجرا: bun scripts/test-compare.ts) */
import { useCompare } from "../src/lib/shop-state";

const s = () => useCompare.getState();
let pass = 0;
const ok = (c: boolean, m: string) => {
  console.log(c ? "✅" : "❌", m);
  if (c) pass++;
};

/* ۱..۴ افزودن چهار قطعه */
[1, 2, 3, 4].forEach((id) => s().toggle(id));
ok(s().ids.length === 4, "افزودن ۴ قطعه");
ok(JSON.stringify(s().ids) === JSON.stringify([1, 2, 3, 4]), "ترتیب انتخاب حفظ می‌شود");
/* ۵ پنجم پذیرفته نمی‌شود */
ok(s().toggle(5) === false && s().ids.length === 4, "قطعهٔ پنجم رد می‌شود (حداکثر ۴)");
/* ۶ برداشتن قطعهٔ موجود با همان toggle */
ok(s().toggle(2) === false && s().ids.length === 3 && !s().ids.includes(2), "برداشتن قطعهٔ موجود با toggle");
/* ۷ پس از آزاد شدن جا، افزودن مجدد */
ok(s().toggle(5) === true && s().ids.includes(5), "افزودن مجدد پس از آزاد شدن جا");
/* ۸ remove */
s().remove(1);
ok(!s().ids.includes(1) && s().ids.length === 3, "remove حذف می‌کند");
/* ۹ remove قطعهٔ ناموجود بی‌اثر است */
s().remove(99);
ok(s().ids.length === 3, "remove قطعهٔ ناموجود بی‌اثر");
/* ۱۰ clear */
s().clear();
ok(s().ids.length === 0, "clear پاک می‌کند");
/* ۱۱ پس از clear، افزودن دوباره کار می‌کند */
ok(s().toggle(9) === true && s().ids.length === 1, "پس از clear، افزودن مجدد کار می‌کند");

console.log(`نتیجه: ${pass}/9`);
process.exit(pass === 9 ? 0 : 1);
