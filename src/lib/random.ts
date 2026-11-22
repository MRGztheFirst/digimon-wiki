import "server-only";
import { db } from "./db";
import { cardSelect } from "./queries";

export async function randomDigimon(n = 6) {
  const rows = await db.$queryRawUnsafe<{ id: number }[]>(`SELECT id FROM "Digimon" ORDER BY RANDOM() LIMIT ${Math.max(1, Math.min(n, 50))}`);
  const ids = rows.map((r) => Number(r.id));
  const items = await db.digimon.findMany({ where: { id: { in: ids } }, select: cardSelect });
  return ids.map((id) => items.find((i) => i.id === id)!).filter(Boolean);
}
