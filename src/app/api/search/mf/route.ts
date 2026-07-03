import { NextRequest, NextResponse } from "next/server";
import { searchMutualFunds } from "@/lib/prices";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json([]);
  const results = await searchMutualFunds(q).catch(() => []);
  return NextResponse.json(results);
}
