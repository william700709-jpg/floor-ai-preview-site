import { NextResponse } from "next/server";
import {
  appendLocalLead,
  normalizeContactPayload,
  sendToGoogleSheetsWebhook,
  validateContactPayload,
  type ContactPayload
} from "@/lib/contact";

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
    const delivery = await sendToGoogleSheetsWebhook(payload);

    if (!delivery.delivered) {
      const localPath = await appendLocalLead(payload);
      console.info("Stored contact request locally", {
        reference: payload.reference,
        localPath
      });
    } else {
      console.info("Delivered contact request to webhook", {
        reference: payload.reference,
        channel: delivery.channel
      });
    }

    return NextResponse.json({
      message: "提交成功",
      reference
    });
  } catch (error) {
    console.error("Contact request delivery failed", {
      reference: payload.reference,
      error
    });

    return NextResponse.json(
      {
        message: "表單已收到，但外部收單服務暫時異常，請稍後再試。"
      },
      { status: 502 }
    );
  }
}
