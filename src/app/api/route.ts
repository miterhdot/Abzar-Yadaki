import { NextResponse } from "next/server";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

/* دستور ۳۲ (A2): محافظت نرخ روی مسیر عمومی */
export async function GET(req: Request) {
  const rl = rateLimit(`hello:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);
  return NextResponse.json({ message: "Hello, world!" });
}