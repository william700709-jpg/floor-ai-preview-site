"use client";

import { useEffect, useState } from "react";

type QuoteCategory = "curtain" | "floor" | "other";

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
  customProductName: string;
  customModel: string;
  customUnit: string;
  materialUnitPrice: string;
  widthCm: string;
  heightCm: string;
  quantity: string;
  notes: string;
};

type SavedQuote = {
  id: string;
  quote_number: string;
  customer_name: string;
  quote_date: string;
  total_amount: number;
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
  fabric_multiplier: number | null;
  minimum_billable_talents: number | null;
};

type ItemPreview = {
  unitPrice: number;
  subtotal: number;
  summary: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
const CM_PER_CHI = 30.3;

function createDraftItem(category: QuoteCategory): DraftItem {
  return {
    id: `${category}-${Math.random().toString(36).slice(2, 10)}`,
    category,
    productId: null,
    locationName: "",
    customProductName: "",
    customModel: "",
    customUnit: "",
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

function parseApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const detail = (payload as { detail?: unknown }).detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const message = "msg" in entry && typeof entry.msg === "string" ? entry.msg : null;
        const location = Array.isArray((entry as { loc?: unknown }).loc)
          ? (entry as { loc: unknown[] }).loc
              .filter((part) => part !== "body")
              .map((part) => String(part))
              .join(".")
          : "";

        if (!message) {
          return null;
        }

        if (location === "items.0.quantity" || location.endsWith(".quantity")) {
          return "數量超出目前允許範圍，請調整後再送出。";
        }

        return location ? `${location}：${message}` : message;
      })
      .filter((value): value is string => Boolean(value));

    if (messages.length > 0) {
      return messages.join("；");
    }
  }

  return null;
}

function formLabel(form: string) {
  const formMap: Record<string, string> = {
    fabric: "布簾",
    sheer: "紗簾",
    roman: "羅馬簾",
    roller: "捲簾",
    daynight: "調光簾",
    spc: "SPC 地板",
    pvc: "PVC 地板",
    laminate: "超耐磨地板",
    engineered: "海島型木地板",
    other: "其他",
  };

  return formMap[form] ?? form;
}

function categoryLabel(category: QuoteCategory) {
  const labels: Record<QuoteCategory, string> = {
    curtain: "窗簾",
    floor: "地板",
    other: "其他",
  };

  return labels[category];
}

function priceLabel(product: QuoteProduct | null, category: QuoteCategory) {
  if (category === "other") {
    return "價格";
  }

  if (!product) {
    return "價格";
  }

  if (product.category === "floor") {
    return "每坪價格";
  }

  if (product.form === "roller" || product.form === "daynight") {
    return "1才價格";
  }

  return "1碼價格";
}

function unitLabel(product: QuoteProduct | null, item: DraftItem) {
  if (item.category === "other") {
    return item.customUnit.trim() || "--";
  }

  return product?.unit_label ?? "--";
}

function defaultProductId(products: QuoteProduct[], category: QuoteCategory) {
  return products.find((product) => product.category === category)?.id ?? null;
}

function computeItemPreview(
  item: DraftItem,
  product: QuoteProduct | null,
  formulaSetting: QuoteFormulaSetting | null
): ItemPreview {
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const materialUnitPrice = Number(
    item.materialUnitPrice || formulaSetting?.material_unit_price_default || product?.price_per_square_meter || 0
  );

  if (item.category === "other") {
    const unit = item.customUnit.trim();
    const styleName = item.customProductName.trim() || "其他項目";

    if (materialUnitPrice <= 0) {
      return {
        unitPrice: 0,
        subtotal: 0,
        summary: "請輸入其他項目的價格後，即可看到試算結果。",
      };
    }

    return {
      unitPrice: materialUnitPrice,
      subtotal: materialUnitPrice * quantity,
      summary: `${styleName}：${quantity} ${unit || "單位"}，可用於安裝、配件或其他自訂項目。`,
    };
  }

  if (!product || materialUnitPrice <= 0) {
    return {
      unitPrice: 0,
      subtotal: 0,
      summary: "請先完成款式與價格設定。",
    };
  }

  if (product.category === "floor") {
    return {
      unitPrice: materialUnitPrice,
      subtotal: materialUnitPrice * quantity,
      summary: `地板：每坪 ${formatCurrency(materialUnitPrice)}，數量 ${quantity} 坪。`,
    };
  }

  const widthCm = Number(item.widthCm);
  const heightCm = Number(item.heightCm);

  if (widthCm <= 0 || heightCm <= 0) {
    return {
      unitPrice: 0,
      subtotal: 0,
      summary: "請輸入寬與高後，即可依公式自動試算。",
    };
  }

  const widthChi = widthCm / CM_PER_CHI;
  const heightChi = heightCm / CM_PER_CHI;
  const roundedWidthChi = Math.ceil(widthChi);

  if (product.form === "fabric") {
    const fabricWidthChi = formulaSetting?.fabric_width_chi || 5;
    const fabricMultiplier = formulaSetting?.fabric_multiplier || 2;
    const railPricePerChi = formulaSetting?.rail_price_per_chi || product.rail_price_per_meter;
    const laborPrice = formulaSetting?.labor_price || product.labor_price;
    const panels = Math.ceil((widthChi * fabricMultiplier) / fabricWidthChi);
    const yards = ((heightChi + 1) * panels) / 3;
    const materialCost = (yards / 2) * materialUnitPrice;
    const laborCost = panels * laborPrice;
    const railCost = roundedWidthChi * railPricePerChi;
    const unitPrice = materialCost + laborCost + railCost;

    return {
      unitPrice,
      subtotal: unitPrice * quantity,
      summary: `布簾：${yards.toFixed(2)} 碼，${panels} 幅，軌道 ${roundedWidthChi} 尺。`,
    };
  }

  if (product.form === "sheer") {
    const fabricMultiplier = formulaSetting?.fabric_multiplier || 2;
    const railPricePerChi = formulaSetting?.rail_price_per_chi || product.rail_price_per_meter;
    const laborPrice = formulaSetting?.labor_price || product.labor_price;
    const yards = Math.ceil((widthChi * fabricMultiplier) / 3);
    const materialCost = (yards / 2) * materialUnitPrice;
    const laborCost = yards * laborPrice;
    const railCost = roundedWidthChi * railPricePerChi;
    const unitPrice = materialCost + laborCost + railCost;

    return {
      unitPrice,
      subtotal: unitPrice * quantity,
      summary: `紗簾：${yards.toFixed(2)} 碼，軌道 ${roundedWidthChi} 尺。`,
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
      summary: `羅馬簾：${yards.toFixed(2)} 碼，${talents.toFixed(2)} 才。`,
    };
  }

  const minimumTalents = formulaSetting?.minimum_billable_talents || 15;
  const discountRate = formulaSetting?.discount_rate ?? 0.4;
  const talents = Math.max(minimumTalents, Math.ceil(widthChi * heightChi));
  const unitPrice = talents * materialUnitPrice * discountRate;

  return {
    unitPrice,
    subtotal: unitPrice * quantity,
    summary: `${formLabel(product.form)}：${talents} 才，折數 ${discountRate}。`,
  };
}

function getInitialUnitPrice(
  item: DraftItem,
  products: QuoteProduct[],
  formulaSettings: QuoteFormulaSetting[]
) {
  const product = products.find((entry) => entry.id === item.productId) ?? null;
  const formula = formulaSettings.find((entry) => entry.form === product?.form) ?? null;
  return formula
    ? String(formula.material_unit_price_default)
    : product
      ? String(product.price_per_square_meter)
      : "";
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
          throw new Error("無法載入報價設定資料。");
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
            const nextItem = { ...item, productId };

            if (!item.materialUnitPrice) {
              nextItem.materialUnitPrice = getInitialUnitPrice(nextItem, productsData, formulasData.items);
            }

            return nextItem;
          })
        );
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "載入資料時發生問題。");
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
        const categoryChanged = Boolean(patch.category && patch.category !== item.category);

        if (categoryChanged) {
          nextItem.productId = defaultProductId(products, patch.category as QuoteCategory);
          nextItem.materialUnitPrice = "";

          if (patch.category !== "curtain") {
            nextItem.widthCm = "";
            nextItem.heightCm = "";
          }

          if (patch.category !== "other") {
            nextItem.customProductName = "";
            nextItem.customUnit = "";
          }

          nextItem.materialUnitPrice = getInitialUnitPrice(nextItem, products, formulaSettings);
        }

        if (patch.productId && patch.productId !== item.productId) {
          nextItem.materialUnitPrice = getInitialUnitPrice(nextItem, products, formulaSettings);
        }

        return nextItem;
      })
    );
  };

  const addItem = (category: QuoteCategory) => {
    const nextItem = createDraftItem(category);
    nextItem.productId = defaultProductId(products, category);
    nextItem.materialUnitPrice = getInitialUnitPrice(nextItem, products, formulaSettings);
    setItems((current) => [...current, nextItem]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    const nextItem = createDraftItem(defaultCategory);
    nextItem.productId = defaultProductId(products, defaultCategory);
    nextItem.materialUnitPrice = getInitialUnitPrice(nextItem, products, formulaSettings);
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
      setErrorMessage("請輸入客戶姓名。");
      return;
    }

    const invalidItem = items.find((item) => {
      if (!item.productId || Number(item.quantity) <= 0 || Number(item.materialUnitPrice) <= 0) {
        return true;
      }

      if (item.category === "curtain") {
        return Number(item.widthCm) <= 0 || Number(item.heightCm) <= 0;
      }

      if (item.category === "other") {
        return !item.customProductName.trim() || !item.customUnit.trim();
      }

      return false;
    });

    if (invalidItem) {
      setErrorMessage("請確認每一筆明細都已填好必要欄位，再送出報價單。");
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
            custom_product_name: item.category === "other" ? item.customProductName.trim() || null : null,
            custom_model: item.customModel.trim() || null,
            custom_unit: item.category === "other" ? item.customUnit.trim() || null : null,
            material_unit_price: Number(item.materialUnitPrice),
            width_cm: item.category === "curtain" ? Number(item.widthCm) : 0,
            height_cm: item.category === "curtain" ? Number(item.heightCm) : 0,
            quantity: Number(item.quantity),
            notes: item.notes.trim() || null,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(parseApiError(payload) ?? "送出報價單失敗。");
      }

      const quote: SavedQuote = await response.json();
      setSavedQuote(quote);
      setSuccessMessage(`報價單已建立：${quote.quote_number}`);
      resetForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "送出報價單失敗。");
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
      setSuccessMessage(`報價單連結已複製：${savedQuote.quote_number}`);
    } catch {
      setErrorMessage("無法複製連結，請直接開啟報價單後再複製網址。");
    }
  };

  if (loading) {
    return (
      <div className="card-surface p-8 text-sm leading-7 text-stone/75">
        正在載入報價設定，請稍候。
      </div>
    );
  }

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
                placeholder="請輸入客戶姓名"
              />
            </label>
            <label className="text-sm text-stone/75">
              客戶電話
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                placeholder="請輸入聯絡電話"
              />
            </label>
            <label className="text-sm text-stone/75 sm:col-span-2">
              安裝地址
              <input
                value={installationAddress}
                onChange={(event) => setInstallationAddress(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                placeholder="請輸入安裝地址"
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
              整體備註
              <input
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                placeholder="例如：含丈量、特殊施工說明"
              />
            </label>
          </div>
        </div>
        {items.map((item, index) => {
          const productOptions = products.filter((product) => product.category === item.category);
          const product = productOptions.find((entry) => entry.id === item.productId) ?? null;
          const preview = previews[index];
          const isFloorItem = item.category === "floor";
          const isOtherItem = item.category === "other";
          const displayStyle = isOtherItem ? item.customProductName.trim() || "尚未填寫" : product ? formLabel(product.form) : "--";

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
                    刪除此項
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
                    <option value="other">其他</option>
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

                {isOtherItem ? (
                  <label className="text-sm text-stone/75">
                    款式
                    <input
                      value={item.customProductName}
                      onChange={(event) => updateItem(item.id, { customProductName: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                      placeholder="請自行輸入款式名稱"
                    />
                  </label>
                ) : (
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
                )}

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
                  {priceLabel(product, item.category)}
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={item.materialUnitPrice}
                    onChange={(event) => updateItem(item.id, { materialUnitPrice: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    placeholder={isOtherItem ? "請輸入此項目價格" : undefined}
                  />
                </label>

                {!isFloorItem && !isOtherItem ? (
                  <label className="text-sm text-stone/75">
                    寬/CM
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

                {!isFloorItem && !isOtherItem ? (
                  <label className="text-sm text-stone/75">
                    高/CM
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
                  {isFloorItem ? "坪數" : "數量"}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                  />
                </label>

                {isOtherItem ? (
                  <label className="text-sm text-stone/75">
                    單位
                    <input
                      value={item.customUnit}
                      onChange={(event) => updateItem(item.id, { customUnit: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                      placeholder="例如：式、支、組、批"
                    />
                  </label>
                ) : (
                  <label className="text-sm text-stone/75">
                    單位
                    <div className="mt-2 rounded-2xl border border-stone/10 bg-[#f7f1e8] px-4 py-3 text-stone">
                      {unitLabel(product, item)}
                    </div>
                  </label>
                )}

                <label className="text-sm text-stone/75 sm:col-span-2">
                  備註
                  <input
                    value={item.notes}
                    onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
                    placeholder="可補充施工方式、配件內容或特殊需求"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 rounded-[28px] bg-[#eef2eb] p-5 sm:grid-cols-3">
                <div className="rounded-3xl bg-white p-4">
                  <p className="text-sm text-stone/65">明細項目</p>
                  <p className="mt-2 text-lg font-semibold text-stone">
                    {categoryLabel(item.category)} / {displayStyle}
                    {item.customModel ? ` / ${item.customModel}` : ""}
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
            onClick={() => addItem("other")}
            className="rounded-full bg-[#eef2eb] px-5 py-3 text-sm font-medium text-stone hover:bg-[#e4ebdf]"
          >
            新增其他項目
          </button>
          <button
            type="button"
            onClick={submitQuote}
            disabled={saving || loading}
            className="rounded-full border border-stone/10 bg-white px-5 py-3 text-sm font-medium text-stone hover:border-stone/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "送出中..." : "送出報價單"}
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
              報價單已建立完成，現在可以直接開啟正式報價頁，列印或另存 PDF 傳給客戶確認。
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
              <p className="text-sm text-stone/70">目前報價單號</p>
              <p className="mt-2 text-xl font-semibold">{savedQuote?.quote_number ?? "尚未送出"}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/70">
            每一筆明細都會即時更新小計與總額，方便你和客戶快速比較不同方案，也能把自訂項目一併放進同一張報價單。
          </p>
        </div>

        <div className="card-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-clay">Tips</p>
          <h3 className="mt-2 text-2xl font-semibold text-stone">使用小提醒</h3>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone/75">
            <p>窗簾會依照款式與尺寸自動套用公式，地板則以每坪價格乘上坪數計算。</p>
            <p>如果這筆是安裝、配件、拆除或其他客製內容，請直接選擇「其他」，再自行輸入款式、單位與價格。</p>
            <p>送出後可立即開啟正式報價單，列印或另存 PDF 給客戶確認。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
