import { NextResponse } from "next/server";
import {
  normalizeContactPayload,
  sendToGoogleSheetsWebhook,
  validateContactPayload,
  type ContactPayload
} from "@/lib/contact";

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 10_000;
const attachmentCategoryLabel: Record<string, string> = {
  space: "空間照片",
  window: "窗戶照片",
  plan: "平面圖或尺寸草圖",
};

export async function POST(request: Request) {
  const body = (await request.json()) as ContactPayload;
  const reference = `Q${Date.now().toString().slice(-8)}`;
  const payload = normalizeContactPayload(body, reference);
  const validationError = validateContactPayload(payload);

  if (validationError) {
    return NextResponse.json(
      {
        message: validationError
      },
      { status: 400 }
    );
  }

  try {
    if (!API_BASE_URL) {
      throw new Error("缺少 NEXT_PUBLIC_PREVIEW_API_BASE_URL");
    }

    const attachmentSummary =
      payload.attachments.length > 0
        ? `\n\n附件資訊：\n${payload.attachments
            .map(
              (attachment) =>
                `- ${attachmentCategoryLabel[attachment.category || ""] ?? attachment.category ?? "未分類"} / ${attachment.name || "未命名檔案"}`,
            )
            .join("\n")}`
        : "";

    const response = await fetch(`${API_BASE_URL}/contact-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reference: payload.reference,
        name: payload.name,
        phone: payload.phone,
        line_id: payload.lineId || null,
        request_type: payload.requestType,
        installation_address: payload.installationAddress || null,
        size_info: payload.sizeInfo || null,
        message: `${payload.message}${attachmentSummary}`,
        source: payload.source
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as { detail?: string } | null;
      throw new Error(errorPayload?.detail ?? "表單暫時無法儲存，請稍後再試。");
    }

    try {
      const delivery = await sendToGoogleSheetsWebhook(payload);
      if (delivery.delivered) {
        console.info("Delivered contact request to webhook", {
          reference: payload.reference,
          channel: delivery.channel
        });
      }
    } catch (deliveryError) {
      console.error("Webhook delivery failed, but local record is preserved", {
        reference: payload.reference,
        error: deliveryError
      });
    }

    return NextResponse.json({
      message: "提交成功",
      reference
    });
  } catch (error) {
    console.error("Contact request storage failed", {
      reference: payload.reference,
      error
    });

    return NextResponse.json(
      {
        message: "表單暫時無法儲存，請稍後再試。"
      },
      { status: 502 }
    );
  }
}
