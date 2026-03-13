"use client";

import { useEffect, useState } from "react";

type QuoteCategory = "curtain" | "floor";

type QuoteProduct = {
  id: number;
  category: QuoteCategory;
  form: string;
  code: string;
  name: string;
  unit_label: string;
  price_per_square_meter: number;
  fullness_factor: number;
  rail_price_per_meter: number;
  labor_price: number;
  minimum_charge: number;
};

type DraftItem = {
  id: string;
  category: QuoteCategory;
  productId: number | null;
  locationName: string;
  customModel: string;
  materialUnitPrice: string;
  widthCm: string;
  heightCm: string;
  quantity: string;
  notes: string;
};

type SavedQuoteItem = {
  id: string;
  location_name: string | null;
  custom_model?: string | null;
  product_name: string;
  pricing_unit?: string | null;
  material_unit_price?: number | null;
};

type SavedQuote = {
  id: string;
  quote_number: string;
  customer_name: string;
  quote_date: string;
  total_amount: number;
  items: SavedQuoteItem[];
};

type QuoteBuilderProps = {
  defaultCategory: QuoteCategory;
};

type QuoteFormulaSetting = {
  id: number;
  form: string;
  display_name: string;
  material_unit_price_default: number;
  discount_rate: number | null;
  rail_price_per_chi: number | null;
  labor_price: number | null;
  fabric_width_chi: number | null;
  minimum_billable_talents: number | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
const CM_PER_CHI = 30.3;

function createDraftItem(category: QuoteCategory): DraftItem {
  return {
    id: `${category}-${Math.random().toString(36).slice(2, 10)}`,
    category,
    productId: null,
    locationName: "",
    customModel: "",
    materialUnitPrice: "",
    widthCm: "",
    heightCm: "",
    quantity: "1",
    notes: "",
  };
}

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

function priceLabel(product: QuoteProduct | null) {
  if (!product) {
    return "單價";
  }

  if (product.category === "floor") {
    return "每坪價格";
  }

  if (product.form === "roller" || product.form === "daynight") {
    return "1才價格";
  }

  return "1碼價格";
}

function defaultProductId(products: QuoteProduct[], category: QuoteCategory) {
  return products.find((product) => product.category === category)?.id ?? products[0]?.id ?? null;
}

function computeItemPreview(
  item: DraftItem,
  product: QuoteProduct | null,
  formulaSetting: QuoteFormulaSetting | null
) {
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const materialUnitPrice = Number(
    item.materialUnitPrice || formulaSetting?.material_unit_price_default || product?.price_per_square_meter || 0
  );

  if (!product || materialUnitPrice <= 0) {
    return {
      unitPrice: 0,
      subtotal: 0,
      summary: "請先輸入價格與數量。",
    };
  }

  if (product.category === "floor") {
    return {
      unitPrice: materialUnitPrice,
      subtotal: materialUnitPrice * quantity,
      summary: `地板每坪 ${formatCurrency(materialUnitPrice)}，數量 ${quantity} 坪`,
    };
  }

  const widthCm = Number(item.widthCm);
  const heightCm = Number(item.heightCm);

  if (widthCm <= 0 || heightCm <= 0) {
    return {
      unitPrice: 0,
      subtotal: 0,
      summary: "請先輸入尺寸與價格。",
    };
  }

  const widthChi = widthCm / CM_PER_CHI;
  const heightChi = heightCm / CM_PER_CHI;
  const roundedWidthChi = Math.ceil(widthChi);

  if (product.form === "fabric") {
    const fabricWidthChi = formulaSetting?.fabric_width_chi || 5;
    const railPricePerChi = formulaSetting?.rail_price_per_chi || product.rail_price_per_meter;
    const laborPrice = formulaSetting?.labor_price || product.labor_price;
    const panels = Math.ceil((widthChi * 2) / fabricWidthChi);
    const yards = ((heightChi + 1) * panels) / 3;
    const materialCost = (yards / 2) * materialUnitPrice;
    const laborCost = panels * laborPrice;
    const railCost = roundedWidthChi * railPricePerChi;
    const unitPrice = materialCost + laborCost + railCost;
    return {
      unitPrice,
      subtotal: unitPrice * quantity,
      summary: `布簾約 ${yards.toFixed(2)} 碼，${panels} 幅，軌道 ${roundedWidthChi} 尺`,
    };
  }

  if (product.form === "sheer") {
    const railPricePerChi = formulaSetting?.rail_price_per_chi || product.rail_price_per_meter;
    const laborPrice = formulaSetting?.labor_price || product.labor_price;
    const yards = Math.ceil((widthChi * 2) / 3);
    const materialCost = (yards / 2) * materialUnitPrice;
    const laborCost = yards * laborPrice;
    const railCost = roundedWidthChi * railPricePerChi;
    const unitPrice = materialCost + laborCost + railCost;
    return {
      unitPrice,
      subtotal: unitPrice * quantity,
      summary: `紗簾約 ${yards.toFixed(2)} 碼，軌道 ${roundedWidthChi} 尺`,
    };
  }

  if (product.form === "roman") {
    const railPricePerChi = formulaSetting?.rail_price_per_chi || product.rail_price_per_meter;
    const laborPrice = formulaSetting?.labor_price || product.labor_price;
    const talents = widthChi * heightChi;
    const yards = Math.max(1, Math.ceil(((heightChi + 1) * 2) / 3));
    const materialCost = (yards / 2) * materialUnitPrice;
    const laborCost = talents * laborPrice;
    const railCost = roundedWidthChi * railPricePerChi;
    const unitPrice = materialCost + laborCost + railCost;
    return {
      unitPrice,
      subtotal: unitPrice * quantity,
      summary: `羅馬簾約 ${yards} 碼，${talents.toFixed(2)} 才`,
    };
  }

  const minimumTalents = formulaSetting?.minimum_billable_talents || 15;
  const discountRate = formulaSetting?.discount_rate ?? 0.4;
  const talents = Math.max(minimumTalents, Math.ceil(widthChi * heightChi));
  const unitPrice = talents * materialUnitPrice * discountRate;
  return {
    unitPrice,
    subtotal: unitPrice * quantity,
    summary: `${formLabel(product.form)}約 ${talents} 才，已套用 ${discountRate} 折數`,
  };
}

export function QuoteBuilder({ defaultCategory }: QuoteBuilderProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [installationAddress, setInstallationAddress] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<DraftItem[]>([createDraftItem(defaultCategory)]);
  const [products, setProducts] = useState<QuoteProduct[]>([]);
  const [formulaSettings, setFormulaSettings] = useState<QuoteFormulaSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedQuote, setSavedQuote] = useState<SavedQuote | null>(null);

  const shareUrl = savedQuote ? `/quotes/${savedQuote.id}` : "";

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [productsResponse, formulasResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/quote-products`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/quote-formulas`, { cache: "no-store" }),
        ]);

        if (!productsResponse.ok || !formulasResponse.ok) {
          throw new Error("無法讀取報價資料");
        }

        const productsData: QuoteProduct[] = await productsResponse.json();
        const formulasData: { items: QuoteFormulaSetting[] } = await formulasResponse.json();

        if (!active) {
          return;
        }

        setProducts(productsData);
        setFormulaSettings(formulasData.items);
        setItems((current) =>
          current.map((item) => {
            const productId = item.productId ?? defaultProductId(productsData, item.category);
            const product = productsData.find((entry) => entry.id === productId) ?? null;
            const formula = formulasData.items.find((entry) => entry.form === product?.form) ?? null;
            return {
              ...item,
              productId,
              materialUnitPrice:
                item.materialUnitPrice ||
                (formula
                  ? String(formula.material_unit_price_default)
                  : product
                    ? String(product.price_per_square_meter)
                    : ""),
            };
          })
        );
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "載入失敗");
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

  const updateItem = (id: string, patch: Partial<DraftItem>) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextItem = { ...item, ...patch };
        const effectiveProductId =
          patch.category && patch.category !== item.category
            ? defaultProductId(products, patch.category)
            : patch.productId ?? nextItem.productId;

        if (patch.category && patch.category !== item.category) {
          nextItem.productId = effectiveProductId;
          if (patch.category === "floor") {
            nextItem.widthCm = "";
            nextItem.heightCm = "";
          }
        }

        if (patch.productId || (patch.category && patch.category !== item.category)) {
          const product = products.find((entry) => entry.id === effectiveProductId) ?? null;
          const formula = formulaSettings.find((entry) => entry.form === product?.form) ?? null;
          nextItem.materialUnitPrice = formula
            ? String(formula.material_unit_price_default)
            : product
              ? String(product.price_per_square_meter)
              : "";
        }

        return nextItem;
      })
    );
  };

  const addItem = (category: QuoteCategory) => {
    const nextItem = createDraftItem(category);
    const productId = defaultProductId(products, category);
    const product = products.find((entry) => entry.id === productId) ?? null;
    const formula = formulaSettings.find((entry) => entry.form === product?.form) ?? null;
    nextItem.productId = productId;
    nextItem.materialUnitPrice = formula
      ? String(formula.material_unit_price_default)
      : product
        ? String(product.price_per_square_meter)
        : "";
    setItems((current) => [...current, nextItem]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    const nextItem = createDraftItem(defaultCategory);
    const productId = defaultProductId(products, defaultCategory);
    const product = products.find((entry) => entry.id === productId) ?? null;
    const formula = formulaSettings.find((entry) => entry.form === product?.form) ?? null;
    nextItem.productId = productId;
    nextItem.materialUnitPrice = formula
      ? String(formula.material_unit_price_default)
      : product
        ? String(product.price_per_square_meter)
        : "";
    setCustomerName("");
    setCustomerPhone("");
    setInstallationAddress("");
    setRemarks("");
    setItems([nextItem]);
  };

  const previews = items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId) ?? null;
    const formula = formulaSettings.find((entry) => entry.form === product?.form) ?? null;
    return computeItemPreview(item, product, formula);
  });

  const subtotalAmount = previews.reduce((sum, preview) => sum + preview.subtotal, 0);
  const taxAmount = subtotalAmount * 0.05;
  const grandTotalAmount = subtotalAmount + taxAmount;
  const depositAmount = grandTotalAmount * 0.3;

  const submitQuote = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!customerName.trim()) {
      setErrorMessage("請先輸入客戶姓名。");
      return;
    }

    const invalidItem = items.find((item) => {
      const requiresSize = item.category === "curtain";
      return (
        !item.productId ||
        (requiresSize && Number(item.widthCm) <= 0) ||
        (requiresSize && Number(item.heightCm) <= 0) ||
        Number(item.quantity) <= 0 ||
        Number(item.materialUnitPrice) <= 0
      );
    });

    if (invalidItem) {
      setErrorMessage("每一筆明細都要有款式、價格與數量；窗簾項目另外需要尺寸。");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          installation_address: installationAddress.trim() || null,
          quote_date: quoteDate,
          remarks: remarks.trim() || null,
          items: items.map((item) => ({
            product_id: item.productId,
            location_name: item.locationName.trim() || null,
            custom_model: item.customModel.trim() || null,
            material_unit_price: Number(item.materialUnitPrice),
            width_cm: item.category === "floor" ? 0 : Number(item.widthCm),
            height_cm: item.category === "floor" ? 0 : Number(item.heightCm),
            quantity: Number(item.quantity),
            notes: item.notes.trim() || null,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? "儲存報價單失敗");
      }

      const quote: SavedQuote = await response.json();
      setSavedQuote(quote);
      setSuccessMessage(`已建立報價單 ${quote.quote_number}`);
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "儲存報價單失敗");
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!savedQuote) {
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/quotes/${savedQuote.id}`);
      setSuccessMessage(`已複製報價單連結 ${savedQuote.quote_number}`);
    } catch {
      setErrorMessage("無法複製連結，請直接使用開啟報價單。");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr,0.65fr]">
      <div className="space-y-6">
        <div className="card-surface p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-stone/75">
              客戶姓名
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
            <label className="text-sm text-stone/75">
              客戶電話
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
            <label className="text-sm text-stone/75 sm:col-span-2">
              安裝地址
              <input
                value={installationAddress}
                onChange={(event) => setInstallationAddress(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
            <label className="text-sm text-stone/75">
              報價日期
              <input
                type="date"
                value={quoteDate}
                onChange={(event) => setQuoteDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
            <label className="text-sm text-stone/75">
              備註
              <input
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
              />
            </label>
          </div>
        </div>

        {items.map((item, index) => {
          const productOptions = products.filter((product) => product.category === item.category);
          const product = productOptions.find((entry) => entry.id === item.productId) ?? null;
          const preview = previews[index];
          const isFloorItem = item.category === "floor";

          return (
            <div key={item.id} className="card-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-clay">Item {index + 1}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone">報價明細</h3>
                </div>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-full border border-stone/10 px-4 py-2 text-sm text-stone/70 hover:border-stone/20 hover:text-stone"
                  >
                    刪除此筆
                  </button>
                ) : null}
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm text-stone/75">
                  類別
                  <select
                    value={item.category}
                    onChange={(event) => updateItem(item.id, { category: event.target.value as QuoteCategory })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  >
                    <option value="curtain">窗簾</option>
                    <option value="floor">地板</option>
                  </select>
                </label>
                <label className="text-sm text-stone/75">
                  施作位置
                  <input
                    value={item.locationName}
                    onChange={(event) => updateItem(item.id, { locationName: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    placeholder="例如：客廳、主臥、小孩房"
                  />
                </label>
                <label className="text-sm text-stone/75">
                  款式
                  <select
                    value={item.productId ?? ""}
                    onChange={(event) => updateItem(item.id, { productId: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  >
                    {productOptions.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {formLabel(entry.form)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-stone/75">
                  型號
                  <input
                    value={item.customModel}
                    onChange={(event) => updateItem(item.id, { customModel: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    placeholder="例如：LG3243-37"
                  />
                </label>
                <label className="text-sm text-stone/75">
                  {priceLabel(product)}
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={item.materialUnitPrice}
                    onChange={(event) => updateItem(item.id, { materialUnitPrice: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  />
                </label>
                {!isFloorItem ? (
                  <label className="text-sm text-stone/75">
                    寬(cm)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.widthCm}
                      onChange={(event) => updateItem(item.id, { widthCm: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    />
                  </label>
                ) : null}
                {!isFloorItem ? (
                  <label className="text-sm text-stone/75">
                    高(cm)
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.heightCm}
                      onChange={(event) => updateItem(item.id, { heightCm: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    />
                  </label>
                ) : null}
                <label className="text-sm text-stone/75">
                  {isFloorItem ? "數量(坪)" : "數量"}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  />
                </label>
                <label className="text-sm text-stone/75">
                  單位
                  <div className="mt-2 rounded-2xl border border-stone/10 bg-[#f7f1e8] px-4 py-3 text-stone">
                    {product?.unit_label ?? "--"}
                  </div>
                </label>
                <label className="text-sm text-stone/75 sm:col-span-2">
                  備註
                  <input
                    value={item.notes}
                    onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 rounded-[28px] bg-[#eef2eb] p-5 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-sm text-stone/65">報價基準</p>
                  <p className="mt-2 text-lg font-semibold text-stone">
                    {product ? `${formLabel(product.form)}${item.customModel ? ` / ${item.customModel}` : ""}` : "--"}
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-sm text-stone/65">單價</p>
                  <p className="mt-2 text-lg font-semibold text-stone">{formatCurrency(preview.unitPrice)}</p>
                </div>
                <div className="rounded-3xl bg-stone p-4 text-white">
                  <p className="text-sm text-white/70">小計</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(preview.subtotal)}</p>
                </div>
                <div className="sm:col-span-3">
                  <p className="text-sm leading-7 text-stone/75">{preview.summary}</p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => addItem("curtain")}
            className="rounded-full bg-stone px-5 py-3 text-sm font-medium text-white hover:bg-stone/90"
          >
            新增窗簾項目
          </button>
          <button
            type="button"
            onClick={() => addItem("floor")}
            className="rounded-full bg-[#d8c2a8] px-5 py-3 text-sm font-medium text-stone hover:bg-[#cfb494]"
          >
            新增地板項目
          </button>
          <button
            type="button"
            onClick={submitQuote}
            disabled={saving || loading}
            className="rounded-full border border-stone/10 bg-white px-5 py-3 text-sm font-medium text-stone hover:border-stone/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "儲存中..." : "送出報價單"}
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-[24px] border border-[#d9a7a7] bg-[#fff4f4] px-5 py-4 text-sm text-[#9c4f4f]">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[24px] border border-[#b6c8a9] bg-[#f1f7ec] px-5 py-4 text-sm text-[#526146]">
            {successMessage}
          </div>
        ) : null}

        {savedQuote ? (
          <div className="card-surface p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-clay">Quote Output</p>
            <p className="mt-2 text-base font-semibold text-stone">{savedQuote.quote_number}</p>
            <p className="mt-2 text-sm leading-7 text-stone/70">
              報價已經整理完成，現在可以直接開啟正式報價單，列印或另存 PDF，方便和家人一起比較、確認。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone px-5 py-3 text-sm font-medium text-white hover:bg-stone/90"
              >
                開啟報價單
              </a>
              <button
                type="button"
                onClick={copyShareLink}
                className="rounded-full border border-stone/10 bg-white px-5 py-3 text-sm font-medium text-stone hover:border-stone/20"
              >
                複製連結
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div className="card-surface bg-stone p-6 text-white sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-white/65">Summary</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-white/70">明細筆數</p>
              <p className="mt-2 text-3xl font-semibold">{items.length}</p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-white/70">合計金額</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(subtotalAmount)}</p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-white/70">稅額金額</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(taxAmount)}</p>
            </div>
            <div className="rounded-3xl bg-[#d8c2a8] p-5 text-stone">
              <p className="text-sm text-stone/70">總價金額</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(grandTotalAmount)}</p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="text-sm text-white/70">訂金30%金額</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(depositAmount)}</p>
            </div>
            <div className="rounded-3xl bg-[#d8c2a8] p-5 text-stone">
              <p className="text-sm text-stone/70">最新報價單號</p>
              <p className="mt-2 text-xl font-semibold">{savedQuote?.quote_number ?? "尚未送出"}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/70">
            先填入尺寸或坪數，就能快速看到預算方向。若內容符合需求，再進一步安排丈量與細節確認會更有效率。
          </p>
        </div>
        <div className="card-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-clay">Tips</p>
          <h3 className="mt-2 text-2xl font-semibold text-stone">怎麼使用更快看懂預算</h3>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone/75">
            <p>先選擇想比較的窗簾或地板款式，再填入尺寸或坪數，就能立即看到價格變化。</p>
            <p>如果想比較不同空間，也可以把客廳、主臥、次臥分開建立，整張報價會更清楚。</p>
            <p>確認後可直接開啟正式報價單，列印或另存 PDF，方便和家人、設計師一起討論。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
