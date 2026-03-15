"use client";

import { useEffect, useState } from "react";

type QuoteFormulaSetting = {
  id: number;
  form: string;
  display_name: string;
  material_unit_price_default: number;
  discount_rate: number | null;
  rail_price_per_chi: number | null;
  labor_price: number | null;
  fabric_width_chi: number | null;
  fabric_multiplier: number | null;
  minimum_billable_talents: number | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export function QuoteFormulaSettings() {
  const [items, setItems] = useState<QuoteFormulaSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch(`${API_BASE_URL}/quote-formulas`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("無法讀取公式設定");
        }
        const payload: { items: QuoteFormulaSetting[] } = await response.json();
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

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const updateItem = (form: string, field: keyof QuoteFormulaSetting, value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.form === form
          ? {
              ...item,
              [field]: value === "" ? null : Number(value),
            }
          : item
      )
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/quote-formulas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            form: item.form,
            material_unit_price_default: Number(item.material_unit_price_default),
            discount_rate: item.discount_rate,
            rail_price_per_chi: item.rail_price_per_chi,
            labor_price: item.labor_price,
            fabric_width_chi: item.fabric_width_chi,
            fabric_multiplier: item.fabric_multiplier,
            minimum_billable_talents: item.minimum_billable_talents,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("儲存公式設定失敗");
      }

      const payload: { items: QuoteFormulaSetting[] } = await response.json();
      setItems(payload.items);
      setMessage("公式設定已更新");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-surface p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-clay">Formula Settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-stone">窗簾公式參數設定</h2>
        <p className="mt-3 text-sm leading-7 text-stone/75">
          在這裡改的參數，會同步套用到報價頁的即時計算與正式報價單。
        </p>
      </div>

      {loading ? (
        <div className="card-surface p-6 text-sm text-stone/60">讀取中...</div>
      ) : null}

      {items.map((item) => (
        <div key={item.form} className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-clay">{item.form}</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone">{item.display_name}</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-stone/75">
              預設材料單價
              <input
                type="number"
                step="0.01"
                value={item.material_unit_price_default}
                onChange={(event) => updateItem(item.form, "material_unit_price_default", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              打折參數
              <input
                type="number"
                step="0.01"
                value={item.discount_rate ?? ""}
                onChange={(event) => updateItem(item.form, "discount_rate", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              軌道一尺價格
              <input
                type="number"
                step="0.01"
                value={item.rail_price_per_chi ?? ""}
                onChange={(event) => updateItem(item.form, "rail_price_per_chi", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              車縫工 / 工資參數
              <input
                type="number"
                step="0.01"
                value={item.labor_price ?? ""}
                onChange={(event) => updateItem(item.form, "labor_price", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              福寬參數
              <input
                type="number"
                step="0.1"
                value={item.fabric_width_chi ?? ""}
                onChange={(event) => updateItem(item.form, "fabric_width_chi", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              布量
              <input
                type="number"
                step="0.1"
                value={item.fabric_multiplier ?? ""}
                onChange={(event) => updateItem(item.form, "fabric_multiplier", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>

            <label className="text-sm text-stone/75">
              最低才數
              <input
                type="number"
                step="1"
                value={item.minimum_billable_talents ?? ""}
                onChange={(event) => updateItem(item.form, "minimum_billable_talents", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving || loading}
          className="rounded-full bg-stone px-5 py-3 text-sm font-medium text-white hover:bg-stone/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "儲存中..." : "儲存公式設定"}
        </button>
      </div>

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
