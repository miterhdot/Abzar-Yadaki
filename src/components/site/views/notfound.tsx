"use client";

export function NotFoundView() {
  return (
    <div className="w" style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 64, fontWeight: 800, color: "var(--or)" }}>۴۰۴</div>
      <h2 style={{ justifyContent: "center" }}>صفحه‌ای که دنبالش بودید پیدا نشد</h2>
      <p style={{ color: "var(--mute)" }}>ممکن است نشانی را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
        <a className="btn" href="#home">
          صفحه اصلی
        </a>
        <a className="btn ghost" href="#shop">
          فروشگاه
        </a>
        <a className="btn ghost" href="#track">
          پیگیری سفارش
        </a>
      </div>
    </div>
  );
}
