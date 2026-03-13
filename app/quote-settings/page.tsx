import { QuoteFormulaSettings } from "@/components/forms/quote-formula-settings";
import { QuoteHistoryManager } from "@/components/forms/quote-history-manager";
import { PageHero } from "@/components/layout/page-hero";

export default function QuoteSettingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Quote Formula Admin"
        title="設定參數"
        description="在同一個頁面維護窗簾公式參數、價格邏輯與最近報價單紀錄。儲存後會直接套用到報價試算與正式報價單。"
      />

      <section className="pb-20">
        <div className="container-shell space-y-10">
          <QuoteFormulaSettings />
          <QuoteHistoryManager />
        </div>
      </section>
    </>
  );
}
