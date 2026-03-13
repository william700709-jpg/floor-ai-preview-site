import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { LineFloatingButton } from "@/components/layout/line-floating-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "暖居空間 | 線上報價網站",
  description: "提供地板與窗簾的風格規劃、線上報價與案例展示。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={notoSansTC.variable}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <LineFloatingButton />
      </body>
    </html>
  );
}
