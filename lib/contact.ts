import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

export type ContactPayload = {
  name?: string;
  phone?: string;
  lineId?: string;
  requestType?: string;
  sizeInfo?: string;
  message?: string;
  source?: string;
};

export type NormalizedContactPayload = {
  reference: string;
  name: string;
  phone: string;
  lineId: string;
  requestType: string;
  sizeInfo: string;
  message: string;
  source: string;
  createdAt: string;
};

export function normalizeContactPayload(
  payload: ContactPayload,
  reference: string
): NormalizedContactPayload {
  return {
    reference,
    name: payload.name?.trim() ?? "",
    phone: payload.phone?.trim() ?? "",
    lineId: payload.lineId?.trim() ?? "",
    requestType: payload.requestType?.trim() ?? "整體規劃",
    sizeInfo: payload.sizeInfo?.trim() ?? "",
    message: payload.message?.trim() ?? "",
    source: payload.source?.trim() ?? "unknown",
    createdAt: new Date().toISOString()
  };
}

export function validateContactPayload(payload: NormalizedContactPayload) {
  if (!payload.name || !payload.phone || !payload.message) {
    return "請填寫姓名、電話與需求內容。";
  }

  return null;
}

export async function sendToGoogleSheetsWebhook(payload: NormalizedContactPayload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return { delivered: false, channel: "none" as const };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Google Sheets webhook 回傳 ${response.status}`);
  }

  return { delivered: true, channel: "google-sheets" as const };
}

export async function appendLocalLead(payload: NormalizedContactPayload) {
  const leadsDir = path.join(process.cwd(), "data", "submissions");
  const leadsFile = path.join(leadsDir, "contact-leads.ndjson");
  await mkdir(leadsDir, { recursive: true });
  await appendFile(leadsFile, `${JSON.stringify(payload)}\n`, "utf8");
  return leadsFile;
}
