import Link from "next/link";
import { contactDetails, navItems } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone/10 bg-[#f2eadf]">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.2fr,0.8fr,1fr]">
        <div>
          <p className="text-2xl font-semibold text-stone">暖居空間</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-stone/75">
            專注於地板與窗簾的整體規劃，讓家的每一個角落都更柔和、安定、耐看。
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">網站導覽</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-stone/80">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-stone">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">聯絡資訊</p>
          <div className="mt-4 space-y-3 text-sm text-stone/80">
            {contactDetails.map((item) => (
              <p key={item.label}>
                <span className="font-medium text-stone">{item.label}</span> {item.value}
              </p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
