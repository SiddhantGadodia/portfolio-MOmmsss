import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/prices";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json([]);
  const results = await searchStocks(q).catch(() => []);
  return NextResponse.json(results);
}
