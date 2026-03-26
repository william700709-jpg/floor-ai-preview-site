import { ContactForm } from "@/components/forms/contact-form";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { featuredProjects, processSteps, services, testimonials } from "@/data/site";

function ServiceIcon({ kind }: { kind: "floor" | "curtain" | "quote" }) {
  if (kind === "floor") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <path d="M8 4.5v15" />
        <path d="M13 4.5v15" />
        <path d="M3.5 9.5h17" />
      </svg>
    );
  }

  if (kind === "curtain") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6h16" />
        <path d="M7 6v12c1.2-.5 2-.5 3 0V6" />
        <path d="M14 6v12c1-.5 1.8-.5 3 0V6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 8.5h6" />
      <path d="M9 12h6" />
      <path d="M9 15.5h4" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="section-space overflow-hidden">
        <div className="container-shell grid items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-clay">溫暖，自然，永恆</p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-stone sm:text-6xl">
              打造自然舒適的
              <br />
              溫馨居家空間
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone/75 sm:text-lg">
              從地板到窗簾，我們提供一站式溫暖、自然、安心的空間規劃與精準報價服務。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/curtain-quote">線上報價</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                查看案例
              </ButtonLink>
              <ButtonLink href="/contact" variant="ghost">
                立即預約
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-sage/40 blur-3xl" />
            <div className="absolute -right-8 bottom-0 h-36 w-36 rounded-full bg-latte/50 blur-3xl" />
            <div className="card-surface relative overflow-hidden rounded-[36px] p-3">
              <Image
                src="/images/home/hero-kitchen-modern.jpg"
                alt="白色廚房與地板搭配的明亮居家空間"
                width={960}
                height={720}
                className="h-[460px] w-full rounded-[30px] object-cover"
                priority
              />
              <div className="absolute bottom-8 left-8 right-8 rounded-[28px] bg-white/82 p-5 backdrop-blur">
                <p className="text-sm font-medium text-stone">空間顧問陪你一起抓預算、選材質、定風格</p>
                <p className="mt-2 text-sm leading-6 text-stone/70">
                  先試算，再安排丈量與正式報價，讓裝修決策更清楚也更安心。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <SectionHeading
            eyebrow="服務內容"
            title="從單一品項到整體搭配，都保留舒服耐看的生活感"
            description="以材質、光線與日常使用習慣為基礎，提供適合長住的選擇，而不是只追求短暫流行。"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service, index) => (
              <div key={service.title} className="card-surface p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-stone">
                  <ServiceIcon kind={index === 0 ? "floor" : index === 1 ? "curtain" : "quote"} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-stone">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone/75">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <div>
            <SectionHeading
              eyebrow="快速估價"
              title="先掌握預算方向，再進一步討論細節"
              description="留下空間尺寸與需求，幫助你快速判斷適合的材質層級與施工方式。"
            />
          </div>
          <div>
            <ContactForm source="quick-quote" title="快速估價表單" compact />
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/curtain-quote" variant="secondary">
                前往線上報價
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <SectionHeading
            eyebrow="服務流程"
            title="每一步都透明清楚，讓你做決定時更有把握"
            align="center"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="card-surface p-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">Step {index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold text-stone">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone/75">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <SectionHeading
            eyebrow="案例展示"
            title="溫暖、自然、能久住的空間樣貌"
            description="挑選幾個不同調性的地板與窗簾搭配，幫助你更快對風格有感。"
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <article key={project.title} className="card-surface overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={874}
                  height={520}
                  className="aspect-[874/520] w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-sm uppercase tracking-[0.22em] text-clay">{project.category}</p>
                  <h3 className="mt-3 text-xl font-semibold text-stone">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone/75">{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-shell">
          <SectionHeading eyebrow="客戶評價" title="把家的感覺做好，回饋自然最真實" align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="card-surface p-7">
                <p className="text-base leading-8 text-stone/80">“{testimonial.quote}”</p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-clay">
                  {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
