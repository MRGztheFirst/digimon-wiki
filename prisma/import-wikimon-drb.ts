import { readFile } from "node:fs/promises";
import { createPrisma } from "./client";
import { PAGES_FILE, wikimonTitle, type PageCache } from "./fetch-wikimon";

const API = "https://wikimon.net/api.php";
const PREFIX = "Digimon added to the Digimon Reference Book in ";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>) {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const res = await fetch(`${API}?${qs}`, { headers: { "User-Agent": "digimon-database-importer" } });
  if (!res.ok) throw new Error(`Wikimon respondeu ${res.status}`);
  return res.json();
}

async function members(category: string) {
  const titles: string[] = [];
  let cont: Record<string, string> = {};
  do {
    const json = await api({ action: "query", list: "categorymembers", cmtitle: `Category:${category}`, cmlimit: "500", cmnamespace: "0", ...cont });
    titles.push(...json.query.categorymembers.map((m: { title: string }) => m.title));
    cont = json.continue ?? {};
    await wait(500);
  } while (cont.cmcontinue);
  return titles;
}

async function main() {
  const cache = JSON.parse(await readFile(PAGES_FILE, "utf8")) as PageCache;
  const json = await api({ action: "query", list: "allcategories", acprefix: PREFIX, aclimit: "100" });
  const categories: string[] = json.query.allcategories.map((c: { category: string }) => c.category);
  const yearOf = new Map<string, number>();
  for (const c of categories) {
    const year = Number(c.slice(PREFIX.length));
    if (!Number.isInteger(year)) continue;
    for (const t of await members(c)) if (!yearOf.has(t) || yearOf.get(t)! > year) yearOf.set(t, year);
  }
  console.log(`Reference Book: ${categories.length} anos, ${yearOf.size} páginas no Wikimon.`);

  const db = createPrisma();
  const all = await db.digimon.findMany({ select: { id: true, name: true, drbYear: true } });
  const counts = new Map<number, number>();
  let changed = 0;
  for (const d of all) {
    const title = wikimonTitle(cache, d.name);
    const year = title ? yearOf.get(title) ?? null : null;
    if (year) counts.set(year, (counts.get(year) ?? 0) + 1);
    if (year === d.drbYear) continue;
    await db.digimon.update({ where: { id: d.id }, data: { drbYear: year } });
    changed++;
  }
  await db.$disconnect();
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`Com ano: ${total} de ${all.length} (${changed} alterados).`);
  console.log([...counts].sort((a, b) => a[0] - b[0]).map(([y, n]) => `${y}: ${n}`).join(" · "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
