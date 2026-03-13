import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL;

export async function GET() {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "缺少 NEXT_PUBLIC_PREVIEW_API_BASE_URL" }, { status: 500 });
  }

  const response = await fetch(`${API_BASE_URL}/contact-requests?limit=50`, { cache: "no-store" });
  const payload = await response.json().catch(() => ({ items: [] }));
  return NextResponse.json(payload, { status: response.status });
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

  const response = await fetch(`${API_BASE_URL}/contact-requests/${encodeURIComponent(reference)}`, {
    method: "DELETE",
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({ status: "deleted" }));
  return NextResponse.json(payload, { status: response.status });
}
