import { NextResponse } from "next/server";
import { getCouncilCount } from "@/lib/counter";

export const revalidate = 0; // always fresh

export async function GET() {
  const count = await getCouncilCount();
  return NextResponse.json({ count });
}
