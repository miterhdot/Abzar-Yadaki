import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ابزار یدکی | لوازم یدکی و ابزار خودرو",
  description:
    "لوازم یدکی اصل و ابزار حرفه‌ای با گارانتی اصالت، قیمت شفاف و ارسال سریع — قطعه درست، فقط با یک جستجو. abzaryadaki.com",
  keywords: ["ابزار یدکی", "لوازم یدکی خودرو", "فیلتر روغن", "لنت ترمز", "ابزار حرفه‌ای", "abzaryadaki"],
  metadataBase: new URL("https://abzaryadaki.com"),
  openGraph: {
    title: "ابزار یدکی | لوازم یدکی و ابزار خودرو",
    description: "قطعه درست، فقط با یک جستجو — برای خودروی شما.",
    url: "https://abzaryadaki.com",
    siteName: "ابزار یدکی",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
