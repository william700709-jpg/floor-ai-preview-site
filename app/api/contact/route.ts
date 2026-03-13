import { NextResponse } from "next/server";
import {
  normalizeContactPayload,
  sendToGoogleSheetsWebhook,
  validateContactPayload,
  type ContactPayload
} from "@/lib/contact";

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL;

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
        message: payload.message,
        source: payload.source
      }),
      cache: "no-store"
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
