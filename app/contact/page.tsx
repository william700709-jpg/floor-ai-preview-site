import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/layout/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { contactDetails } from "@/data/site";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="聯絡我們"
        description="如果你已經有大致需求，歡迎先透過電話或 LINE 聯繫，我們會協助你安排合適的下一步。"
      />

      <section className="pb-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="card-surface p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">聯絡方式</p>
            <div className="mt-6 space-y-4">
              {contactDetails.map((item) => (
                <div key={item.label} className="rounded-3xl bg-sand/70 p-4">
                  <p className="text-sm text-stone/60">{item.label}</p>
                  <p className="mt-1 text-lg font-medium text-stone">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <ButtonLink href="/">回到首頁</ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                查看案例
              </ButtonLink>
            </div>
          </div>

          <ContactForm source="contact-page" title="留言表單" />
        </div>
      </section>
    </>
  );
}
