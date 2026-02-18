import { NextResponse } from "next/server";
import { getCouncilCount } from "@/lib/counter";

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  const count = await getCouncilCount();
  return NextResponse.json({ count });
}
