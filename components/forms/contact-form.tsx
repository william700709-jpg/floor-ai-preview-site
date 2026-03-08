"use client";

import { FormEvent, useState } from "react";

type ContactFormProps = {
  source: "contact-page" | "quick-quote";
  title?: string;
  compact?: boolean;
};

type FormState = {
  name: string;
  phone: string;
  lineId: string;
  requestType: string;
  sizeInfo: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  lineId: "",
  requestType: "整體規劃",
  sizeInfo: "",
  message: ""
};

export function ContactForm({ source, title, compact = false }: ContactFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          source
        })
      });

      const data = (await response.json()) as { message?: string; reference?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "送出失敗，請稍後再試。");
      }

      setStatus("success");
      setFeedback(
        data.reference
          ? `已收到你的需求，案件編號 ${data.reference}。我們會盡快與你聯繫。`
          : "已收到你的需求，我們會盡快與你聯繫。"
      );
      setForm(initialState);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
    }
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-6 sm:p-8">
      {title ? (
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-clay">{title}</p>
          <p className="mt-3 text-sm leading-7 text-stone/70">
            留下需求後，我們會依你的空間條件與偏好提供後續建議。
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-stone/70">
          姓名
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="請輸入姓名"
            className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage"
          />
        </label>
        <label className="text-sm text-stone/70">
          電話
          <input
            required
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="請輸入聯絡電話"
            className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage"
          />
        </label>

        {compact ? null : (
          <label className="text-sm text-stone/70 sm:col-span-2">
            LINE ID
            <input
              value={form.lineId}
              onChange={(event) => updateField("lineId", event.target.value)}
              placeholder="方便聯繫可留下 LINE ID"
              className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage"
            />
          </label>
        )}

        <label className="text-sm text-stone/70">
          需求項目
          <select
            value={form.requestType}
            onChange={(event) => updateField("requestType", event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage"
          >
            <option>地板估價</option>
            <option>窗簾估價</option>
            <option>整體規劃</option>
            <option>到府丈量</option>
          </select>
        </label>
        <label className="text-sm text-stone/70">
          空間資訊
          <input
            value={form.sizeInfo}
            onChange={(event) => updateField("sizeInfo", event.target.value)}
            placeholder="例如 12 坪客廳 / 220x180 cm"
            className="mt-2 w-full rounded-2xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage"
          />
        </label>
        <label className={`text-sm text-stone/70 ${compact ? "sm:col-span-2" : "sm:col-span-2"}`}>
          需求說明
          <textarea
            required
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="請描述空間需求、預計施工時間、喜歡的色系或遮光需求"
            className={`mt-2 w-full rounded-3xl border border-stone/10 bg-white px-4 py-3 outline-none focus:border-sage ${
              compact ? "min-h-32" : "min-h-40"
            }`}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-full bg-stone px-6 py-3 text-sm font-medium text-white hover:bg-[#5b574f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "送出中..." : "送出諮詢需求"}
        </button>
        <p
          className={`text-sm ${
            status === "error"
              ? "text-[#b45309]"
              : status === "success"
                ? "text-[#4d6b4f]"
                : "text-stone/55"
          }`}
        >
          {feedback || "送出後會由專人與你確認細節。"}
        </p>
      </div>
    </form>
  );
}
