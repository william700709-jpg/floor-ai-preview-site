import { QuoteBuilder } from "@/components/forms/quote-builder";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";

export default function CurtainQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Online Quote"
        title="線上報價"
        description="想先知道大約預算，不用等業務回覆。只要選好款式、填入尺寸或坪數，就能立即看到報價金額，先快速比較適合自己的方案，也方便和家人一起討論。"
      />

      <section className="pb-20">
        <div className="container-shell">
          <QuoteBuilder defaultCategory="curtain" />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <SectionHeading
            eyebrow="Online Workflow"
            title="第一次使用，也能很快看懂預算方向"
            description="從挑選款式到看到報價結果，整個流程都整理得更簡單。先了解大約價格與內容，再決定是否進一步安排丈量與正式規劃。"
          />
          <div className="grid gap-4 text-sm leading-7 text-stone/75">
            <div className="card-surface p-5">可依空間逐筆建立項目，像是客廳、主臥、次臥，一次整理在同一張報價單裡，閱讀更清楚。</div>
            <div className="card-surface p-5">窗簾輸入尺寸、地板填入坪數後，畫面會立即顯示合計、稅額、總價與訂金，先快速掌握預算範圍。</div>
            <div className="card-surface p-5">送出後可直接開啟正式報價單，方便列印、另存 PDF，或傳給家人一起確認款式與價格。</div>
            <div className="card-surface p-5">如果看到喜歡的搭配與合理的預算，就能更快進一步安排丈量與後續討論，減少反覆詢問的時間。</div>
          </div>
        </div>
      </section>
    </>
  );
}
