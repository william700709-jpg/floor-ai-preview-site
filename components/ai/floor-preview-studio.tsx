"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { lineContact } from "@/data/site";
import { mockFloorPreviewStyles, type FloorPreviewStyle } from "@/data/ai-preview";

type ApiFloorStyle = {
  id: number;
  key: string;
  name: string;
  description: string;
  tone: string;
  badge: string;
  colors: [string, string, string];
};

type PreviewResult = {
  previewUrl: string;
  originalUrl: string;
  usedFallback: boolean;
};

const acceptedTypes = ["image/jpeg", "image/jpg", "image/png"];

function getApiBase() {
  return process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
}

function makeAbsoluteUrl(url: string) {
  if (url.startsWith("http")) {
    return url;
  }

  return `${getApiBase().replace(/\/api\/v1$/, "")}${url}`;
}

async function generateFallbackPreview(file: File, style: FloorPreviewStyle) {
  const originalUrl = URL.createObjectURL(file);
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("瀏覽器不支援預覽畫布。");
  }

  context.drawImage(imageBitmap, 0, 0);

  const polygon = [
    [canvas.width * 0.16, canvas.height * 0.6],
    [canvas.width * 0.84, canvas.height * 0.6],
    [canvas.width * 0.98, canvas.height * 0.98],
    [canvas.width * 0.02, canvas.height * 0.98]
  ] as const;

  context.save();
  context.beginPath();
  polygon.forEach(([x, y], index) => {
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.closePath();
  context.clip();

  const fill = context.createLinearGradient(0, canvas.height * 0.58, canvas.width, canvas.height);
  fill.addColorStop(0, style.colors[0]);
  fill.addColorStop(0.5, style.colors[1]);
  fill.addColorStop(1, style.colors[2]);
  context.globalAlpha = 0.72;
  context.fillStyle = fill;
  context.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.5);

  context.globalAlpha = 0.18;
  for (let i = -canvas.width; i < canvas.width * 1.8; i += 42) {
    context.fillStyle = i % 84 === 0 ? style.colors[2] : style.colors[0];
    context.beginPath();
    context.moveTo(i, canvas.height * 0.58);
    context.lineTo(i + 22, canvas.height * 0.58);
    context.lineTo(i + 260, canvas.height);
    context.lineTo(i + 220, canvas.height);
    context.closePath();
    context.fill();
  }

  context.globalAlpha = 0.22;
  context.fillStyle = "#000000";
  const shade = context.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.22)");
  context.fillStyle = shade;
  context.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
  context.restore();

  return {
    originalUrl,
    previewUrl: canvas.toDataURL("image/png"),
    usedFallback: true
  };
}

export function FloorPreviewStudio() {
  const [styles, setStyles] = useState<ApiFloorStyle[]>(mockFloorPreviewStyles);
  const [selectedStyleId, setSelectedStyleId] = useState<number>(mockFloorPreviewStyles[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [serviceMessage, setServiceMessage] = useState("正在使用展示版花色資料。");

  useEffect(() => {
    let ignore = false;

    async function fetchStyles() {
      try {
        const response = await fetch(`${getApiBase()}/floor-styles`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("style api unavailable");
        }

        const data = (await response.json()) as { items?: ApiFloorStyle[] };
        if (!ignore && data.items?.length) {
          setStyles(data.items);
          setSelectedStyleId(data.items[0].id);
          setServiceMessage("已連接後端花色 API。");
        }
      } catch {
        if (!ignore) {
          setServiceMessage("後端花色 API 尚未連線，先顯示展示版花色。");
        }
      }
    }

    fetchStyles();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedStyle = styles.find((style) => style.id === selectedStyleId) ?? styles[0];

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setError("");
    setResult(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!acceptedTypes.includes(nextFile.type)) {
      setFile(null);
      setError("請上傳 jpg、jpeg 或 png 圖片。");
      return;
    }

    setFile(nextFile);
  }

  async function handlePreview() {
    if (!file) {
      setError("請先上傳一張空間照片。");
      return;
    }

    if (!selectedStyle) {
      setError("請先選擇地板花色。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${getApiBase()}/uploads`, {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error("upload failed");
      }

      const uploadData = (await uploadResponse.json()) as {
        upload_id: string;
        original_url: string;
      };

      const previewResponse = await fetch(`${getApiBase()}/previews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          upload_id: uploadData.upload_id,
          floor_style_id: selectedStyle.id
        })
      });

      if (!previewResponse.ok) {
        throw new Error("preview failed");
      }

      const previewData = (await previewResponse.json()) as {
        result_url: string;
        original_url: string;
      };

      setResult({
        originalUrl: makeAbsoluteUrl(previewData.original_url),
        previewUrl: makeAbsoluteUrl(previewData.result_url),
        usedFallback: false
      });
      setServiceMessage("已使用後端預覽生成 API。");
    } catch {
      const fallback = await generateFallbackPreview(file, selectedStyle);
      setResult(fallback);
      setServiceMessage("後端尚未連線，目前顯示前端展示版模擬結果。");
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setResult(null);
    setError("");
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[0.92fr,1.08fr]">
      <section className="card-surface p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">Step 1</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone">上傳空間照片</h2>
          </div>
          <span className="rounded-full bg-sand px-4 py-2 text-xs font-medium text-stone/75">
            JPG / JPEG / PNG
          </span>
        </div>

        <label className="mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-stone/20 bg-gradient-to-br from-white to-sand/70 px-6 text-center hover:border-sage">
          <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone shadow-sm">
            選擇室內照片
          </span>
          <p className="mt-4 text-sm leading-7 text-stone/70">
            建議上傳客廳、房間或開放式空間照片，拍攝角度能看到完整地板會更理想。
          </p>
          {file ? <p className="mt-4 text-sm font-medium text-[#4d6b4f]">已選擇：{file.name}</p> : null}
        </label>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">Step 2</p>
          <h3 className="mt-3 text-2xl font-semibold text-stone">挑選地板花色</h3>
          <p className="mt-2 text-sm leading-7 text-stone/70">{serviceMessage}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {styles.map((style) => {
            const selected = style.id === selectedStyleId;

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyleId(style.id)}
                className={`rounded-[24px] border p-4 text-left ${
                  selected
                    ? "border-stone bg-stone text-white shadow-soft"
                    : "border-stone/10 bg-white/80 text-stone hover:border-sage"
                }`}
              >
                <div
                  className="h-20 rounded-[18px]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]} 55%, ${style.colors[2]})`
                  }}
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{style.name}</p>
                    <p className={`mt-1 text-sm ${selected ? "text-white/70" : "text-stone/70"}`}>
                      {style.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      selected ? "bg-white/15 text-white" : "bg-sand text-stone/70"
                    }`}
                  >
                    {style.badge}
                  </span>
                </div>
                <p className={`mt-3 text-xs uppercase tracking-[0.2em] ${selected ? "text-white/70" : "text-clay"}`}>
                  {style.tone}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handlePreview()}
            disabled={loading}
            className="rounded-full bg-stone px-6 py-3 text-sm font-medium text-white hover:bg-[#5b574f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "預覽生成中..." : "立即預覽"}
          </button>
          <a
            href={lineContact.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#88a17c] px-6 py-3 text-sm font-medium text-white hover:bg-[#758d69]"
          >
            加 LINE 詢價
          </a>
        </div>

        {error ? <p className="mt-4 text-sm text-[#b45309]">{error}</p> : null}
      </section>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-stone/10 px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">Result</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone">原圖與預覽圖</h2>
          <p className="mt-2 text-sm leading-7 text-stone/70">
            此圖為模擬示意，實際效果依現場採光、空間條件與施工方式為準。
          </p>
        </div>

        {result ? (
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-stone/10 p-4 md:border-b-0 md:border-r">
              <p className="mb-3 text-sm font-medium text-stone/65">原始照片</p>
              <img src={result.originalUrl} alt="原始空間照片" className="h-[320px] w-full rounded-[24px] object-cover" />
            </div>
            <div className="p-4">
              <p className="mb-3 text-sm font-medium text-stone/65">
                預覽結果{result.usedFallback ? "（展示版）" : ""}
              </p>
              <img src={result.previewUrl} alt="地板預覽結果" className="h-[320px] w-full rounded-[24px] object-cover" />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-8 text-center">
            <div className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-stone">等待預覽</div>
            <p className="mt-5 max-w-md text-sm leading-7 text-stone/70">
              上傳照片並選好花色後，就會在這裡看到原圖與地板預覽圖，方便快速比較不同木地板風格。
            </p>
          </div>
        )}

        <div className="border-t border-stone/10 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-stone ring-1 ring-stone/10 hover:bg-sand"
            >
              更換花色再試一次
            </button>
            <a
              href={result?.previewUrl ?? "#"}
              download="floor-preview.png"
              className={`rounded-full px-5 py-3 text-sm font-medium ${
                result
                  ? "bg-stone text-white hover:bg-[#5b574f]"
                  : "cursor-not-allowed bg-stone/20 text-stone/45"
              }`}
            >
              下載預覽圖
            </a>
            <a
              href={lineContact.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#88a17c] px-5 py-3 text-sm font-medium text-white hover:bg-[#758d69]"
            >
              加 LINE 詢價
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
