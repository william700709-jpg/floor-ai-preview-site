import { lineContact } from "@/data/site";

export function LineFloatingButton() {
  return (
    <a
      href={lineContact.href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-white/70 bg-[#88a17c] px-5 py-3 text-sm font-medium text-white shadow-soft hover:translate-y-[-2px] hover:bg-[#758d69] print:hidden"
      aria-label="加入 LINE 諮詢"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-base">
        LINE
      </span>
      <span className="hidden sm:inline">加入 LINE</span>
    </a>
  );
}
