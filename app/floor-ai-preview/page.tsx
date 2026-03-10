import { FloorPreviewStudio } from "@/components/ai/floor-preview-studio";
import { PageHero } from "@/components/layout/page-hero";

export default function FloorAiPreviewPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Floor Preview"
        title="地板 AI 預覽"
        description="上傳家中空間照片，先挑選品項，再選喜歡的地板花色，就能快速看到模擬套用後的地板視覺效果。"
      />

      <section className="pb-20">
        <div className="container-shell">
          <FloorPreviewStudio />
        </div>
      </section>
    </>
  );
}
