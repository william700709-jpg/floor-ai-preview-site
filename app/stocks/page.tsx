"use client";

import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";

const API_BASE = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type StockFeature = {
  symbol: string;
  trade_date: string;
  bias_20d_pct: number | null;
  bias_10d_pct: number | null;
  vwap_20: number | null;
  avg_volume_20: number | null;
  total_score: number | null;
  strategy_tier: string | null;
  market_cap: number | null;
};

function bias20Color(v: number | null) {
  if (v === null) return "text-stone/40";
  if (v <= -5) return "text-emerald-600 font-semibold";
  if (v < 0) return "text-emerald-500";
  if (v === 0) return "text-stone/60";
  if (v < 5) return "text-amber-500";
  return "text-red-500 font-semibold";
}

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-stone/30">—</span>;
  const styles: Record<string, string> = {
    "Lift-off": "bg-emerald-100 text-emerald-700",
    Build: "bg-amber-100 text-amber-700",
    Watch: "bg-stone/10 text-stone/60",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[tier] ?? "bg-stone/10 text-stone/60"}`}>
      {tier}
    </span>
  );
}

function fmt(v: number | null, digits = 2, suffix = "") {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}${suffix}`;
}

function fmtMarketCap(v: number | null) {
  if (v === null) return "—";
  const yi = v / 1e8;
  return yi >= 10000
    ? `${(yi / 10000).toFixed(1)} 兆`
    : `${yi.toFixed(0)} 億`;
}

export default function StocksPage() {
  const [items, setItems] = useState<StockFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/stocks/features?top_market_cap_n=100&sort_by=bias_20d_pct&limit=100`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows: StockFeature[] = data.items ?? [];
      setItems(rows);
      if (rows.length > 0) setTradeDate(rows[0].trade_date);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="股票觀察"
            title="市值前100｜MA20 乖離率由低到高"
            description={tradeDate ? `資料日期：${tradeDate}` : "依市值篩選前 100 大個股，乖離率越低表示股價越接近或低於 20 日均線。"}
          />
          <button
            onClick={load}
            disabled={loading}
            className="shrink-0 rounded-full bg-stone px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5b574f] disabled:opacity-50"
          >
            {loading ? "載入中…" : "重新整理"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
            無法取得資料：{error}。請確認後端服務是否啟動。
          </div>
        )}

        {!error && (
          <div className="mt-8 card-surface overflow-hidden">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-stone/50">
                載入中…
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-stone/50">
                目前沒有資料，請先執行資料同步。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone/10 bg-sand/40 text-left text-xs font-semibold uppercase tracking-wider text-stone/50">
                      <th className="px-5 py-3.5">#</th>
                      <th className="px-5 py-3.5">股票代號</th>
                      <th className="px-5 py-3.5 text-right">MA20 乖離率</th>
                      <th className="px-5 py-3.5 text-right">MA10 乖離率</th>
                      <th className="px-5 py-3.5 text-right">市值</th>
                      <th className="px-5 py-3.5 text-right">VWAP20</th>
                      <th className="px-5 py-3.5 text-right">總分</th>
                      <th className="px-5 py-3.5">策略</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={item.symbol}
                        className="border-b border-stone/8 transition-colors hover:bg-sand/20 last:border-0"
                      >
                        <td className="px-5 py-3.5 text-stone/40 tabular-nums">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-semibold text-stone">{item.symbol}</td>
                        <td className={`px-5 py-3.5 text-right tabular-nums ${bias20Color(item.bias_20d_pct)}`}>
                          {fmt(item.bias_20d_pct, 2, "%")}
                        </td>
                        <td className={`px-5 py-3.5 text-right tabular-nums ${bias20Color(item.bias_10d_pct)}`}>
                          {fmt(item.bias_10d_pct, 2, "%")}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-stone/70">
                          {fmtMarketCap(item.market_cap)}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-stone/70">
                          {item.vwap_20 !== null ? item.vwap_20.toFixed(2) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-stone/70">
                          {item.total_score ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <TierBadge tier={item.strategy_tier} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-6 text-xs text-stone/45">
          <span>
            <span className="mr-1 font-semibold text-emerald-600">綠色</span>乖離率為負（股價低於均線）
          </span>
          <span>
            <span className="mr-1 font-semibold text-amber-500">橘色</span>乖離率輕微偏高
          </span>
          <span>
            <span className="mr-1 font-semibold text-red-500">紅色</span>乖離率明顯偏高（≥5%）
          </span>
        </div>
      </div>
    </section>
  );
}
