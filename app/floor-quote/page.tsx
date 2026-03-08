import { FloorEstimator } from "@/components/forms/floor-estimator";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";

const floorHighlights = [
  "輸入長寬後自動換算平方公尺與坪數",
  "依材質種類估算材料箱數",
  "施工方式不同會反映在試算總價",
  "方便先抓預算區間，再安排現場丈量"
];

export default function FloorQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Floor Estimate"
        title="地板估價試算"
        description="先以空間尺寸、地板款式與施工方式做初步估價，幫助你快速了解合適的預算範圍。"
      />

      <section className="pb-20">
        <div className="container-shell">
          <FloorEstimator />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <SectionHeading
            eyebrow="估價說明"
            title="展示版試算包含哪些內容？"
            description="目前先以常見材質與工法建立簡易模型，讓頁面能展示實際互動與價格邏輯。"
          />
          <div className="grid gap-4">
            {floorHighlights.map((item) => (
              <div key={item} className="card-surface p-5 text-sm leading-7 text-stone/75">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
