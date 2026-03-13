import { NextResponse } from "next/server";

import { deleteLocalLead, readLocalLeads } from "@/lib/contact";

export async function GET() {
  const items = await readLocalLeads();
  return NextResponse.json({ items });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ message: "缺少 reference" }, { status: 400 });
  }

  await deleteLocalLead(reference);
  return NextResponse.json({ status: "deleted" });
}
