import { PageHero } from "@/components/layout/page-hero";

const values = [
  {
    title: "先理解生活，再談材料",
    description: "我們重視空間的長期使用感，會先了解家庭成員、採光與清潔習慣，再推薦適合的方向。"
  },
  {
    title: "報價透明，好比較",
    description: "把價格拆解成看得懂的項目，讓你知道預算差異來自哪裡，而不是只看到總數字。"
  },
  {
    title: "風格與實用並行",
    description: "不追求過度裝飾，而是把材質、色彩與日常便利性調整到剛剛好的平衡。"
  }
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="關於我們"
        description="暖居空間是一個以居家舒適感為核心的地板與窗簾規劃品牌，期待把每一次估價都做得清楚、安心、有溫度。"
      />

      <section className="pb-20">
        <div className="container-shell grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="card-surface p-7">
              <h2 className="text-2xl font-semibold text-stone">{value.title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone/75">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
