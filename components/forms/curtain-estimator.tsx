"use client";

import { useMemo, useState } from "react";
import { curtainOptions } from "@/data/site";

export function CurtainEstimator() {
  const [width, setWidth] = useState(220);
  const [height, setHeight] = useState(180);
  const [type, setType] = useState(curtainOptions.types[0].value);
  const [fabric, setFabric] = useState(curtainOptions.fabrics[0].value);
  const [blackout, setBlackout] = useState(curtainOptions.blackoutLevels[0].value);

  const result = useMemo(() => {
    const typeOption = curtainOptions.types.find((item) => item.value === type)!;
    const fabricOption = curtainOptions.fabrics.find((item) => item.value === fabric)!;
    const blackoutOption = curtainOptions.blackoutLevels.find((item) => item.value === blackout)!;
    const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
    const safeHeight = Number.isFinite(height) && height > 0 ? height : 0;
    const sizeFactor = (safeWidth / 100) * (safeHeight / 100);
    const total =
      sizeFactor > 0
        ? Math.round(
            typeOption.basePrice * sizeFactor * fabricOption.multiplier * blackoutOption.multiplier
          )
        : 0;
    const hasInputs = safeWidth > 0 && safeHeight > 0;

    return { sizeFactor, total, hasInputs };
  }, [blackout, fabric, height, type, width]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <div className="card-surface p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-stone/75">
            窗戶寬度（公分）
            <input
              type="number"
              min="0"
              step="1"
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            />
          </label>
          <label className="text-sm text-stone/75">
            窗戶高度（公分）
            <input
              type="number"
              min="0"
              step="1"
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            />
          </label>
          <label className="text-sm text-stone/75">
            窗簾類型
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            >
              {curtainOptions.types.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-stone/75">
            布料
            <select
              value={fabric}
              onChange={(event) => setFabric(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            >
              {curtainOptions.fabrics.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-stone/75 sm:col-span-2">
            遮光需求
            <select
              value={blackout}
              onChange={(event) => setBlackout(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 text-stone outline-none focus:border-sage"
            >
              {curtainOptions.blackoutLevels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card-surface bg-[#eef2eb] p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-clay">估價結果</p>
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl bg-white p-5">
            <p className="text-sm text-stone/65">窗面大小係數</p>
            <p className="mt-2 text-3xl font-semibold text-stone">{result.sizeFactor.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl bg-stone p-5 text-white">
            <p className="text-sm text-white/70">預估價格</p>
            <p className="mt-2 text-4xl font-semibold">NT$ {result.total.toLocaleString()}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-stone/70">
          {result.hasInputs
            ? "此金額為單窗初估，若有特殊窗型、電動軌道、雙層窗簾或現場安裝限制，會另行調整。"
            : "請先輸入正確的窗戶寬度與高度，系統才會開始計算價格。"}
        </p>
      </div>
    </div>
  );
}
