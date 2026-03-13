"use client";

import { useEffect, useState } from "react";

type QuoteHistoryItem = {
  id: string;
  quote_number: string;
  customer_name: string;
  quote_date: string;
  total_amount: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

function formatCurrency(value: number) {
  return `NT$ ${Math.round(value).toLocaleString("zh-TW")}`;
}

export function QuoteHistoryManager() {
  const [items, setItems] = useState<QuoteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQuotes() {
      try {
        const response = await fetch(`${API_BASE_URL}/quotes?limit=20`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("無法讀取最近報價單");
        }

        const payload: { items: QuoteHistoryItem[] } = await response.json();
        if (active) {
          setItems(payload.items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "讀取失敗");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuotes();

    return () => {
      active = false;
    };
  }, []);

  const deleteQuote = async (quoteId: string) => {
    const confirmed = window.confirm("確定要刪除這張報價單嗎？刪除後就無法復原。");
    if (!confirmed) {
      return;
    }

    setBusyId(quoteId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("刪除報價單失敗");
      }

      setItems((current) => current.filter((item) => item.id !== quoteId));
      setMessage("報價單已刪除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除失敗");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-clay">Quote Records</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone">最近報價單</h2>
        <p className="mt-3 text-sm leading-7 text-stone/75">
          在這裡可以快速回看已建立的報價單，也能直接開啟或刪除不需要的紀錄。
        </p>
      </div>

      {loading ? <div className="card-surface p-6 text-sm text-stone/60">讀取中...</div> : null}

      {!loading && items.length === 0 ? (
        <div className="card-surface p-6 text-sm text-stone/60">目前還沒有已儲存的報價單。</div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="card-surface p-4 sm:p-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[24px] border border-stone/10 bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-stone">{item.quote_number}</p>
                  <p className="mt-1 text-sm text-stone/65">
                    {item.customer_name} / {item.quote_date}
                  </p>
                  <p className="mt-2 text-sm font-medium text-clay">{formatCurrency(item.total_amount)}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`/quotes/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-stone px-5 py-2.5 text-sm font-medium text-white hover:bg-stone/90"
                  >
                    瀏覽
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteQuote(item.id)}
                    disabled={busyId === item.id}
                    className="rounded-full border border-[#d9a7a7] bg-white px-5 py-2.5 text-sm font-medium text-[#9c4f4f] hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === item.id ? "刪除中..." : "刪除"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[24px] border border-[#b6c8a9] bg-[#f1f7ec] px-5 py-4 text-sm text-[#526146]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-[#d9a7a7] bg-[#fff4f4] px-5 py-4 text-sm text-[#9c4f4f]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
