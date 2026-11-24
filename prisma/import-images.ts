import { createPrisma } from "./client";

const prisma = createPrisma();
const API = "https://digi-api.com/api/v1/digimon?pageSize=5000";
const CREDIT = "Arte oficial © Bandai — via Digi-API / Wikimon";

const OVERRIDES: Record<string, string> = {
  atlurkabuterimon: "Atlur Kabuterimon (Blue)",
  tsunomon: "Tunomon",
  pinocchimon: "Pinochimon",
  ogremon: "Orgemon",
  rapidmon: "Rapidmon Perfect",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

async function main() {
  console.log("Baixando a lista da Digi-API...");
  const res = await fetch(API);
  if (!res.ok) throw new Error(`Digi-API respondeu ${res.status}`);
  const json = (await res.json()) as { content: { name: string; image: string }[] };
  const byName = new Map(json.content.map((d) => [norm(d.name), d]));

  const all = await prisma.digimon.findMany({ select: { id: true, slug: true, name: true, otherNames: true, romaji: true, imageUrl: true } });
  let updated = 0;
  const missing: string[] = [];
  for (const d of all) {
    if (d.imageUrl && !d.imageUrl.includes("digi-api.com")) continue;
    const candidates = [OVERRIDES[d.slug], d.name, ...(d.otherNames?.split(",") ?? []), d.romaji].filter(Boolean) as string[];
    const hit = candidates.map((c) => byName.get(norm(c))).find(Boolean);
    if (!hit) {
      missing.push(d.name);
      continue;
    }
    await prisma.digimon.update({ where: { id: d.id }, data: { imageUrl: hit.image, imageCredit: CREDIT } });
    updated++;
  }
  console.log(`Imagens definidas: ${updated}. Sem correspondência: ${missing.length}${missing.length ? ` (${missing.join(", ")})` : ""}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
