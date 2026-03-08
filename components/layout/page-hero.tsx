import { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="card-surface relative overflow-hidden p-8 sm:p-12">
          <div className="absolute inset-0 bg-grain bg-[size:18px_18px] opacity-40" />
          <div className="absolute -right-14 top-0 h-48 w-48 rounded-full bg-latte/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-sage/25 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-clay">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-stone/75">{description}</p>
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
