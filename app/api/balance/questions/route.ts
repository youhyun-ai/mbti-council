import { NextResponse } from "next/server";
import { BALANCE_QUESTIONS } from "@/lib/balance-questions";

export async function GET() {
  return NextResponse.json({ questions: BALANCE_QUESTIONS });
}
