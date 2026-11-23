import { NextResponse } from "next/server";
import { quickSearch } from "@/lib/queries";
import { getI18n } from "@/i18n/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").slice(0, 80);
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 25);
  const [{ t }, rows] = await Promise.all([getI18n(), quickSearch(q, limit)]);
  const results = rows.map((r) => ({
    ...r,
    stage: r.stage && { ...r.stage, name: t(r.stage.name) },
    attribute: r.attribute && { ...r.attribute, name: t(r.attribute.name) },
  }));
  return NextResponse.json({ results });
}
