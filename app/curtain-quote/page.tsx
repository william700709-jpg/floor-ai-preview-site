import { CurtainEstimator } from "@/components/forms/curtain-estimator";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/ui/section-heading";

const curtainNotes = [
  "依窗戶寬高建立基礎面積係數",
  "不同窗簾型態採用不同基礎單價",
  "布料等級與遮光需求會調整整體倍數",
  "適合用來快速比較不同方案的預算差異"
];

export default function CurtainQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Curtain Estimate"
        title="窗簾估價試算"
        description="針對常見窗型提供快速試算，讓你先抓出不同布料與遮光等級的價格方向。"
      />

      <section className="pb-20">
        <div className="container-shell">
          <CurtainEstimator />
        </div>
      </section>

      <section className="pb-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <SectionHeading
            eyebrow="試算邏輯"
            title="讓你能先比較需求，再進一步細談材質"
            description="正式報價時還會納入窗型結構、軌道、打摺倍數與安裝條件，本頁先做展示版互動。"
          />
          <div className="grid gap-4">
            {curtainNotes.map((item) => (
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
