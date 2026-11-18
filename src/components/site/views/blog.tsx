"use client";

import { C } from "@/data/store";
import { useData, useRoute } from "@/lib/shop-state";
import { Crumb } from "../bits-helper";

/* مجلهٔ ابزاریدکی — دستور ۴۲/M3 (پیشنهاد ۳): راهنمای خرید با لینک داخلی به دسته‌ها برای سئو */

export function BlogView() {
  const posts = useData((s) => s.posts);
  return (
    <>
      <Crumb parts={["مقالات"]} />
      <div className="w">
        <h2>مجلهٔ ابزاریدکی</h2>
        <p style={{ color: "var(--mute)", marginTop: -6 }}>
          راهنمای خرید و نگهداری قطعات — با لینک مستقیم به فروشگاه.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((p) => (
            <a
              key={p.id}
              href={`#post-${p.id}`}
              className="panel"
              style={{ display: "block", color: "inherit", textDecoration: "none", padding: 16 }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 30 }}>{p.e}</span>
                <div style={{ flex: 1 }}>
                  <b>{p.t}</b>
                  <p style={{ margin: "6px 0", color: "var(--mute)" }}>{p.x}</p>
                  <small style={{ color: "var(--or)" }}>خواندن مقاله ‹</small>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export function PostView() {
  const pid = useRoute((s) => s.pid);
  const go = useRoute((s) => s.go);
  const post = useData((s) => s.posts.find((p) => p.id === pid));
  const validCat = post ? C.some(([, c]) => c === post.c) : false;

  return (
    <>
      <Crumb
        parts={[
          <a key="b" href="#blog">
            مقالات
          </a>,
          post?.t ?? "مقاله",
        ]}
      />
      <div className="w" style={{ maxWidth: 760 }}>
        {!post ? (
          <div className="panel" style={{ textAlign: "center", padding: "30px 16px" }}>
            <div style={{ fontSize: 44 }}>📝</div>
            <b>مقاله پیدا نشد</b>
            <p style={{ color: "var(--mute)" }}>
              <a href="#blog" style={{ color: "var(--or)" }}>
                بازگشت به فهرست مقالات ‹
              </a>
            </p>
          </div>
        ) : (
          <div className="panel" style={{ padding: 18 }}>
            <div style={{ fontSize: 36 }}>{post.e}</div>
            <h2 style={{ margin: "6px 0" }}>{post.t}</h2>
            <p style={{ color: "var(--mute)" }}>{post.x}</p>
            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {post.b.split("\n\n").map((par, i) => (
                <p key={i} style={{ margin: 0, lineHeight: 2 }}>
                  {par}
                </p>
              ))}
            </div>
            {validCat && (
              <a
                className="btn"
                href="#shop"
                style={{ marginTop: 14, display: "inline-block" }}
                onClick={() => go("shop", { cat: post.c, q: "" })}
              >
                خرید {post.c} مناسب خودروی شما ‹
              </a>
            )}
            <small style={{ color: "var(--mute)", display: "block", marginTop: 12 }}>
              <a href="#blog" style={{ color: "var(--or)" }}>
                همهٔ مقالات ‹
              </a>
            </small>
          </div>
        )}
      </div>
    </>
  );
}
