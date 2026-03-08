import Link from "next/link";
import { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const styles = {
  primary:
    "bg-stone text-white hover:bg-[#5b574f] shadow-lg shadow-stone/10",
  secondary:
    "bg-white/80 text-stone ring-1 ring-stone/10 hover:bg-white",
  ghost:
    "bg-transparent text-stone ring-1 ring-stone/15 hover:bg-white/70"
};

export function ButtonLink({
  href,
  children,
  variant = "primary"
}: ButtonLinkProps) {
  const className = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium ${styles[variant]}`;
  const isExternal = href.startsWith("http");

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
