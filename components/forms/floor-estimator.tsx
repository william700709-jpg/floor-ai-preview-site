"use client";

import { useMemo, useState } from "react";
import { floorOptions } from "@/data/site";

export function FloorEstimator() {
  const [length, setLength] = useState(4.2);
  const [width, setWidth] = useState(3.6);
  const [style, setStyle] = useState(floorOptions.styles[0].value);
  const [installMethod, setInstallMethod] = useState(floorOptions.installMethods[0].value);

  const result = useMemo(() => {
    const styleOption = floorOptions.styles.find((item) => item.value === style)!;
    const installOption = floorOptions.installMethods.find((item) => item.value === installMethod)!;
    const safeLength = Number.isFinite(length) && length > 0 ? length : 0;
    const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
    const area = safeLength * safeWidth;
    const ping = area / 3.3058;
    const estimatedBoxes = area > 0 ? Math.ceil(area / styleOption.coverage) : 0;
    const total = area > 0 ? Math.round(ping * styleOption.unitPrice * installOption.multiplier) : 0;
    const hasInputs = safeLength > 0 && safeWidth > 0;

    return { area, ping, estimatedBoxes, total, hasInputs };
  }, [installMethod, length, style, width]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <div className="card-surface p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-stone/75">
            房間長度（公尺）
            <input
              type="number"
              min="0"
              step="0.1"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none ring-0 focus:border-sage"
            />
          </label>
          <label className="text-sm text-stone/75">
            房間寬度（公尺）
            <input
              type="number"
              min="0"
              step="0.1"
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none ring-0 focus:border-sage"
            />
          </label>
          <label className="text-sm text-stone/75">
            地板款式
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            >
              {floorOptions.styles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-stone/75">
            鋪設方式
            <select
              value={installMethod}
              onChange={(event) => setInstallMethod(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            >
              {floorOptions.installMethods.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card-surface bg-stone p-6 text-white sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-white/65">估價結果</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-white/8 p-4">
            <p className="text-sm text-white/70">空間面積</p>
            <p className="mt-2 text-3xl font-semibold">{result.area.toFixed(2)} m²</p>
          </div>
          <div className="rounded-3xl bg-white/8 p-4">
            <p className="text-sm text-white/70">換算坪數</p>
            <p className="mt-2 text-3xl font-semibold">{result.ping.toFixed(2)} 坪</p>
          </div>
          <div className="rounded-3xl bg-white/8 p-4">
            <p className="text-sm text-white/70">預估片數 / 箱數</p>
            <p className="mt-2 text-3xl font-semibold">{result.estimatedBoxes} 箱</p>
          </div>
          <div className="rounded-3xl bg-[#d8c2a8] p-4 text-stone">
            <p className="text-sm text-stone/70">預估總價</p>
            <p className="mt-2 text-3xl font-semibold">NT$ {result.total.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-white/70">
          {result.hasInputs
            ? "此試算為展示版本，實際報價會依現場地坪條件、收邊方式、材料損耗與施工區域調整。"
            : "請先輸入正確的長度與寬度，系統才會開始計算坪數與預估價格。"}
        </p>
      </div>
    </div>
  );
}
