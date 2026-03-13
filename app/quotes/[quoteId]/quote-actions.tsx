"use client";

type QuoteActionsProps = {
  quoteId: string;
};

export function QuoteActions({ quoteId }: QuoteActionsProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/quotes/${quoteId}`);
      window.alert("已複製報價單連結");
    } catch {
      window.alert("複製失敗，請直接複製網址列");
    }
  };

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-stone px-5 py-3 text-sm font-medium text-white hover:bg-stone/90"
      >
        列印 / 另存 PDF
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-full border border-stone/10 bg-white px-5 py-3 text-sm font-medium text-stone hover:border-stone/20"
      >
        複製連結
      </button>
    </div>
  );
}
