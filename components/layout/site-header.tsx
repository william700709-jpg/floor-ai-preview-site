"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/data/site";

export function SiteHeader() {
  const pathname = usePathname();
  const headerNavItems = [...navItems, { href: "/product-info", label: "產品資訊" }];

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/85 backdrop-blur-xl">
      <div className="container-shell py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage/30 text-sm font-semibold text-stone">
              暖居
            </div>
            <div>
              <p className="text-base font-semibold text-stone">暖居空間</p>
              <p className="text-xs tracking-[0.24em] text-stone/55">FLOOR & CURTAIN STUDIO</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 shadow-soft md:flex">
            {headerNavItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm ${
                    isActive ? "bg-stone text-white" : "text-stone/80 hover:bg-sand"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/contact"
            className="rounded-full bg-stone px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5b574f]"
          >
            預約丈量
          </Link>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {headerNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  isActive ? "bg-stone text-white" : "bg-white/80 text-stone/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
