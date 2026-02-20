import { NextResponse } from "next/server";

import { getCouncil } from "@/lib/council-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const council = await getCouncil(id);

  if (!council) {
    return NextResponse.json({ error: "Council not found" }, { status: 404 });
  }

  return NextResponse.json(council);
}
