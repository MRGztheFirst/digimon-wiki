import { NextResponse } from "next/server";
import { randomDigimon } from "@/lib/random";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const [d] = await randomDigimon(1);
  return NextResponse.redirect(new URL(d ? `/digimon/${d.slug}` : "/digimon", req.url));
}
