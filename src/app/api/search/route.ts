import { NextResponse } from "next/server";
import { quickSearch } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").slice(0, 80);
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 25);
  const results = await quickSearch(q, limit);
  return NextResponse.json({ results });
}
