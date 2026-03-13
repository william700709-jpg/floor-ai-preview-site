import { notFound } from "next/navigation";

import { QuoteActions } from "./quote-actions";

export const dynamic = "force-dynamic";

type QuoteItem = {
  id: string;
  sort_order: number;
  form: string;
  location_name: string | null;
  custom_model: string | null;
  pricing_unit: string | null;
  material_unit_price: number | null;
  width_cm: number;
  height_cm: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  formula_summary: string | null;
  notes: string | null;
};

type Quote = {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_phone: string | null;
  installation_address: string | null;
  quote_date: string;
  remarks: string | null;
  total_amount: number;
  items: QuoteItem[];
};

function formatCurrency(value: number) {
  return `NT$ ${Math.round(value).toLocaleString("zh-TW")}`;
}

function formLabel(form: string) {
  const formMap: Record<string, string> = {
    fabric: "布簾",
    sheer: "紗簾",
    roman: "羅馬簾",
    roller: "捲簾",
    daynight: "調光簾",
    spc: "SPC 地板",
    laminate: "超耐磨地板",
    engineered: "海島型地板",
  };

  return formMap[form] ?? form;
}

function formatDimension(value: number) {
  return value > 0 ? String(value) : "-";
}

async function getQuote(quoteId: string): Promise<Quote | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
  const response = await fetch(`${apiBaseUrl}/quotes/${quoteId}`, { cache: "no-store" });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to load quote");
  }

  return response.json();
}

export default async function QuoteDocumentPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const quote = await getQuote(quoteId);

  if (!quote) {
    notFound();
  }

  const subtotalAmount = quote.total_amount;
  const taxAmount = subtotalAmount * 0.05;
  const grandTotalAmount = subtotalAmount + taxAmount;
  const depositAmount = grandTotalAmount * 0.3;

  return (
    <section className="quote-document section-space">
      <div className="container-shell">
        <div className="quote-sheet mx-auto max-w-5xl space-y-6">
          <div className="card-surface quote-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-clay">Quote Document</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone">晨宴傢飾報價單</h1>
                <p className="quote-print-optional mt-3 text-sm leading-7 text-stone/70">
                  這是給客戶看的正式報價內容，列印或另存 PDF 時只會保留報價單本身。
                </p>
              </div>
              <QuoteActions quoteId={quote.id} />
            </div>

            <div className="quote-meta-grid quote-meta-grid-four mt-8 grid gap-4 rounded-[28px] bg-[#f7f1e8] p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-stone/60">報價單號</p>
                <p className="mt-2 text-lg font-semibold text-stone">{quote.quote_number}</p>
              </div>
              <div>
                <p className="text-sm text-stone/60">報價日期</p>
                <p className="mt-2 text-lg font-semibold text-stone">{quote.quote_date}</p>
              </div>
              <div>
                <p className="text-sm text-stone/60">客戶姓名</p>
                <p className="mt-2 text-lg font-semibold text-stone">{quote.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-stone/60">客戶電話</p>
                <p className="mt-2 text-lg font-semibold text-stone">{quote.customer_phone || "-"}</p>
              </div>
            </div>

            <div className="quote-meta-grid quote-meta-grid-two mt-4 grid gap-4 rounded-[28px] border border-stone/10 p-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-stone/60">安裝地址</p>
                <p className="mt-2 text-base leading-7 text-stone">{quote.installation_address || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-stone/60">整單備註</p>
                <p className="mt-2 text-base leading-7 text-stone">{quote.remarks || "-"}</p>
              </div>
            </div>
          </div>

          <div className="card-surface quote-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="quote-line-items min-w-full border-collapse text-left">
                <thead className="bg-stone text-white">
                  <tr>
                    <th className="px-4 py-4 text-base font-medium">項次</th>
                    <th className="px-4 py-4 text-base font-medium">施作位置</th>
                    <th className="px-4 py-4 text-base font-medium">款式</th>
                    <th className="px-4 py-4 text-base font-medium">型號</th>
                    <th className="px-4 py-4 text-base font-medium">價格基準</th>
                    <th className="px-4 py-4 text-base font-medium">寬/CM</th>
                    <th className="px-4 py-4 text-base font-medium">高/CM</th>
                    <th className="px-4 py-4 text-base font-medium">數量</th>
                    <th className="px-4 py-4 text-base font-medium">單價</th>
                    <th className="px-4 py-4 text-base font-medium">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-[#fcfaf5]"}>
                      <td className="px-4 py-4 text-base text-stone">{index + 1}</td>
                      <td className="px-4 py-4 text-base text-stone">{item.location_name || "-"}</td>
                      <td className="px-4 py-4 text-base text-stone">{formLabel(item.form)}</td>
                      <td className="px-4 py-4 text-base text-stone">{item.custom_model || "-"}</td>
                      <td className="px-4 py-4 text-base text-stone">
                        {item.material_unit_price && item.pricing_unit
                          ? `${formatCurrency(item.material_unit_price)} / ${item.pricing_unit}`
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-base text-stone">{formatDimension(item.width_cm)}</td>
                      <td className="px-4 py-4 text-base text-stone">{formatDimension(item.height_cm)}</td>
                      <td className="px-4 py-4 text-base text-stone">{item.quantity}</td>
                      <td className="px-4 py-4 text-base text-stone">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-4 text-base font-semibold text-stone">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="quote-bottom-grid grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="card-surface quote-card p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-clay">計價說明</p>
              <div className="quote-notes mt-4 space-y-3 text-sm leading-7 text-stone/75">
                {quote.items.map((item, index) => (
                  <div key={item.id}>
                    <p>
                      {index + 1}. {item.location_name || "未填位置"} / {formLabel(item.form)}
                      {item.custom_model ? ` / ${item.custom_model}` : ""}
                    </p>
                    <p>{item.formula_summary || "-"}</p>
                    {item.notes ? <p>備註：{item.notes}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface quote-card quote-totals-card p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-clay">Total</p>
              <div className="quote-totals-grid mt-4 space-y-4">
                <div className="quote-total-box rounded-3xl border border-stone/10 bg-[#fcfaf5] p-4">
                  <p className="text-sm text-stone/60">合計金額</p>
                  <p className="mt-2 text-2xl font-semibold text-stone">{formatCurrency(subtotalAmount)}</p>
                </div>
                <div className="quote-total-box rounded-3xl border border-stone/10 bg-[#fcfaf5] p-4">
                  <p className="text-sm text-stone/60">稅額金額</p>
                  <p className="mt-2 text-2xl font-semibold text-stone">{formatCurrency(taxAmount)}</p>
                </div>
                <div className="quote-total-box quote-total-box-accent rounded-3xl border border-[#ceb18d] bg-[#d8c2a8] p-4">
                  <p className="text-sm text-stone/70">總價金額</p>
                  <p className="mt-2 text-2xl font-semibold text-stone">{formatCurrency(grandTotalAmount)}</p>
                </div>
                <div className="quote-total-box rounded-3xl border border-stone/10 bg-[#fcfaf5] p-4">
                  <p className="text-sm text-stone/60">訂金30%金額</p>
                  <p className="mt-2 text-2xl font-semibold text-stone">{formatCurrency(depositAmount)}</p>
                </div>
              </div>
              <p className="quote-print-optional mt-4 text-sm leading-7 text-stone/70">
                若需修改款式、型號、尺寸或單價，請回報價頁重開新單，再重新列印。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
