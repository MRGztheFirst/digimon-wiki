import type { Prisma } from "@prisma/client";
import { db } from "./db";

export const cardSelect = {
  id: true,
  slug: true,
  name: true,
  nameJp: true,
  number: true,
  imageUrl: true,
  stage: { select: { name: true, slug: true, color: true } },
  attribute: { select: { name: true, slug: true, color: true } },
} satisfies Prisma.DigimonSelect;

export type CardDigimon = Prisma.DigimonGetPayload<{ select: typeof cardSelect }>;

export async function quickSearch(q: string, limit = 8) {
  const term = q.trim();
  if (!term) return [];
  const rows = await db.digimon.findMany({
    where: {
      OR: [
        { name: { contains: term } },
        { nameJp: { contains: term } },
        { romaji: { contains: term } },
        { otherNames: { contains: term } },
        { slug: { contains: term.toLowerCase().replace(/\s+/g, "-") } },
      ],
    },
    select: cardSelect,
    take: 60,
  });
  const t = term.toLowerCase();
  const score = (r: CardDigimon) => {
    const n = r.name.toLowerCase();
    if (n === t) return 0;
    if (n.startsWith(t)) return 1;
    if (n.includes(t)) return 2;
    return 3;
  };
  return rows.sort((a, b) => score(a) - score(b) || a.name.length - b.name.length).slice(0, limit);
}
