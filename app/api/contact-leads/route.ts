import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 10_000;

async function readJsonOrFallback<T>(response: Response, fallback: T) {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "缺少 NEXT_PUBLIC_PREVIEW_API_BASE_URL" }, { status: 500 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/contact-requests?limit=50`, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload = await readJsonOrFallback(response, { items: [] });
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Contact leads fetch failed", error);
    return NextResponse.json({ message: "目前無法讀取聯絡資料，請稍後再試。" }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "缺少 NEXT_PUBLIC_PREVIEW_API_BASE_URL" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ message: "缺少 reference" }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/contact-requests/${encodeURIComponent(reference)}`, {
      method: "DELETE",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload = await readJsonOrFallback(response, { status: "deleted" });
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Contact lead deletion failed", error);
    return NextResponse.json({ message: "目前無法刪除聯絡資料，請稍後再試。" }, { status: 502 });
  }
}
