"use client";

import { useEffect, useState } from "react";

type ContactLead = {
  reference: string;
  name: string;
  phone: string;
  lineId: string;
  requestType: string;
  installationAddress: string;
  sizeInfo: string;
  message: string;
  source: string;
  createdAt: string;
};

export function ContactLeadsManager() {
  const [items, setItems] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReference, setExpandedReference] = useState<string | null>(null);
  const [busyReference, setBusyReference] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeads() {
      try {
        const response = await fetch("/api/contact-leads", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("無法讀取快速估價表單資料");
        }

        const payload: { items: ContactLead[] } = await response.json();
        if (active) {
          setItems(
            payload.items.map((item) => ({
              ...item,
              lineId: (item as ContactLead & { line_id?: string }).line_id ?? item.lineId ?? "",
              requestType: (item as ContactLead & { request_type?: string }).request_type ?? item.requestType,
              installationAddress:
                (item as ContactLead & { installation_address?: string }).installation_address ??
                item.installationAddress ??
                "",
              sizeInfo: (item as ContactLead & { size_info?: string }).size_info ?? item.sizeInfo ?? "",
            }))
          );
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

    loadLeads();

    return () => {
      active = false;
    };
  }, []);

  const deleteLead = async (reference: string) => {
    const confirmed = window.confirm("確定要刪除這筆快速估價表單嗎？");
    if (!confirmed) {
      return;
    }

    setBusyReference(reference);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/contact-leads?reference=${encodeURIComponent(reference)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("刪除表單失敗");
      }

      setItems((current) => current.filter((item) => item.reference !== reference));
      setExpandedReference((current) => (current === reference ? null : current));
      setMessage("快速估價表單已刪除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除失敗");
    } finally {
      setBusyReference(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-clay">Lead Records</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone">快速估價表單</h2>
        <p className="mt-3 text-sm leading-7 text-stone/75">
          客戶從前台送出的需求會保留在這裡，方便你查看內容、聯繫客戶或刪除舊資料。
        </p>
      </div>

      {loading ? <div className="card-surface p-6 text-sm text-stone/60">讀取中...</div> : null}

      {!loading && items.length === 0 ? (
        <div className="card-surface p-6 text-sm text-stone/60">目前還沒有快速估價表單資料。</div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="card-surface p-4 sm:p-6">
          <div className="space-y-4">
            {items.map((item) => {
              const expanded = expandedReference === item.reference;

              return (
                <div key={item.reference} className="rounded-[24px] border border-stone/10 bg-[#fffdf8] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone">{item.reference}</p>
                      <p className="mt-1 text-sm text-stone/65">
                        {item.name} / {item.phone}
                      </p>
                      <p className="mt-1 text-sm text-stone/65">
                        {item.requestType} / {item.sizeInfo || "未填空間資訊"}
                      </p>
                      <p className="mt-1 text-sm text-stone/65">{item.installationAddress || "未填地址"}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedReference(expanded ? null : item.reference)}
                        className="rounded-full bg-stone px-5 py-2.5 text-sm font-medium text-white hover:bg-stone/90"
                      >
                        {expanded ? "收合" : "閱讀"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLead(item.reference)}
                        disabled={busyReference === item.reference}
                        className="rounded-full border border-[#d9a7a7] bg-white px-5 py-2.5 text-sm font-medium text-[#9c4f4f] hover:bg-[#fff4f4] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyReference === item.reference ? "刪除中..." : "刪除"}
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="mt-4 grid gap-4 rounded-[20px] bg-white p-4 text-sm leading-7 text-stone/75 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-clay">LINE ID</p>
                        <p className="mt-1">{item.lineId || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-clay">來源</p>
                        <p className="mt-1">{item.source || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-clay">建立時間</p>
                        <p className="mt-1">{item.createdAt}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-clay">地址</p>
                        <p className="mt-1">{item.installationAddress || "-"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-clay">需求說明</p>
                        <p className="mt-1 whitespace-pre-wrap">{item.message || "-"}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
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
