import { readFile } from "node:fs/promises";
import { createPrisma } from "./client";
import { PAGES_FILE, wikimonTitle, type PageCache } from "./fetch-wikimon";

type Prisma = ReturnType<typeof createPrisma>;

const STAGES: Record<string, string> = {
  "Baby I": "em-treinamento-1",
  "Baby II": "em-treinamento-2",
  Child: "novato",
  Adult: "campeao",
  Perfect: "perfeito",
  Ultimate: "mega",
  Armor: "armor",
  Hybrid: "hibrido",
  Digitama: "digiovo",
};
const ATTRS: Record<string, string> = {
  Vaccine: "vaccine",
  Data: "data",
  Virus: "virus",
  Free: "free",
  Variable: "variable",
  Unknown: "unknown",
  "No Data": "no-data",
  None: "no-data",
};

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const tidyName = (name: string) => name.replace(/(\S)\(/g, "$1 (").replace(/\s{2,}/g, " ").trim();

const clean = (v: string | undefined) =>
  v
    ?.replace(/<!--[\s\S]*?-->|<ref[^>]*\/>|<ref[\s\S]*?<\/ref>|\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .split(/<br\s*\/?>/i)[0]
    .trim() || undefined;

function infobox(text: string) {
  const start = text.indexOf("{{S2");
  if (start < 0) return null;
  const end = text.indexOf("\n}}", start);
  const body = text.slice(start, end < 0 ? undefined : end);
  const fields: Record<string, string> = {};
  for (const m of body.matchAll(/\n\|([a-z0-9]+)=([^\n]*)/g)) if (!(m[1] in fields)) fields[m[1]] = m[2];
  return fields;
}

const numbered = (fields: Record<string, string>, prefix: string) =>
  Object.keys(fields)
    .filter((k) => new RegExp(`^${prefix}\\d+$`).test(k))
    .sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)))
    .map((k) => clean(fields[k]))
    .filter((v): v is string => !!v);

function modeBase(name: string, find: (n: string) => number | undefined, self: number) {
  if (!/\bMode\b/.test(name)) return undefined;
  const paren = name.indexOf("(");
  if (paren > 0 && /\bMode\b/.test(name.slice(paren))) {
    const id = find(name.slice(0, paren));
    return id !== self ? id : undefined;
  }
  const words = name.replace(/\s*\(.*$/, "").split(/\s+/);
  for (let k = words.indexOf("Mode") - 1; k >= 1; k--) {
    const id = find(words.slice(0, k).join(" "));
    if (id && id !== self) return id;
  }
  return undefined;
}

export async function importWikimonInfo(prisma: Prisma, pages: PageCache) {
  const wikimon = await prisma.source.findFirst({ where: { kind: "wikimon", title: "Wikimon" } });
  if (!wikimon) throw new Error('Fonte "Wikimon" não encontrada. Rode "npm run db:seed" antes.');
  const [stages, attrs, families] = await Promise.all([prisma.stage.findMany(), prisma.attribute.findMany(), prisma.family.findMany()]);
  const stageId = new Map(stages.map((s) => [s.slug, s.id]));
  const attrId = new Map(attrs.map((a) => [a.slug, a.id]));
  const famId = new Map(families.map((f) => [f.slug, f.id]));

  const all = await prisma.digimon.findMany({
    select: { id: true, name: true, otherNames: true, stageId: true, attributeId: true, baseId: true, _count: { select: { families: true } } },
  });

  let renamed = 0;
  for (const d of all) {
    const name = tidyName(d.name);
    if (name === d.name) continue;
    await prisma.digimon.update({ where: { id: d.id }, data: { name } });
    d.name = name;
    renamed++;
  }

  const counts = { names: 0, stages: 0, attributes: 0, families: 0, modes: 0 };
  const unknownFamilies = new Map<string, number>();
  for (const d of all) {
    const title = wikimonTitle(pages, d.name);
    const fields = title ? infobox(pages.pages[title] ?? "") : null;
    if (!fields) continue;
    const data: { otherNames?: string; stageId?: number; attributeId?: number } = {};

    const dub = clean(fields.dub);
    const known = (d.otherNames ?? "").split(",").map((n) => n.trim()).filter(Boolean);
    if (dub && !norm(dub).startsWith(norm(d.name)) && !known.some((n) => norm(n) === norm(dub))) {
      data.otherNames = [...known, dub].join(", ");
      d.otherNames = data.otherNames;
      counts.names++;
    }

    if (!d.stageId) {
      const id = numbered(fields, "l").map((l) => stageId.get(STAGES[l] ?? "")).find(Boolean);
      if (id) {
        data.stageId = id;
        counts.stages++;
      }
    }

    if (!d.attributeId) {
      const id = numbered(fields, "a").map((a) => attrId.get(ATTRS[a] ?? "")).find(Boolean);
      if (id) {
        data.attributeId = id;
        counts.attributes++;
      }
    }

    if (Object.keys(data).length) await prisma.digimon.update({ where: { id: d.id }, data });

    if (!d._count.families) {
      const ids = [...new Set(numbered(fields, "f").map((f) => {
        const id = famId.get(slugify(f));
        if (!id) unknownFamilies.set(f, (unknownFamilies.get(f) ?? 0) + 1);
        return id;
      }).filter((id): id is number => !!id))];
      if (ids.length) {
        await prisma.digimonFamily.createMany({ data: ids.map((familyId) => ({ digimonId: d.id, familyId, status: "official", sourceId: wikimon.id })) });
        counts.families++;
      }
    }
  }

  const byName = new Map<string, number>();
  for (const d of all) if (!byName.has(norm(d.name))) byName.set(norm(d.name), d.id);
  for (const d of all) for (const n of (d.otherNames ?? "").split(",")) if (n.trim() && !byName.has(norm(n))) byName.set(norm(n), d.id);
  const find = (n: string) => byName.get(norm(n));
  const unlinked: string[] = [];
  for (const d of all) {
    if (d.baseId || !/\bMode\b/.test(d.name)) continue;
    const base = modeBase(d.name, find, d.id);
    if (!base) {
      unlinked.push(d.name);
      continue;
    }
    await prisma.digimon.update({ where: { id: d.id }, data: { baseId: base, variantKind: "Modo" } });
    counts.modes++;
  }

  console.log(`Nomes arrumados: ${renamed}. Nomes em inglês adicionados: ${counts.names}.`);
  console.log(`Preenchidos pelo Wikimon: ${counts.stages} estágios, ${counts.attributes} atributos, ${counts.families} Digimon com família.`);
  console.log(`Modos ligados à forma base: ${counts.modes}.${unlinked.length ? ` Sem forma base no banco: ${unlinked.join(", ")}.` : ""}`);
  if (unknownFamilies.size) console.log(`Famílias do Wikimon sem cadastro: ${[...unknownFamilies].map(([f, n]) => `${f} (${n})`).join(", ")}.`);
}

if (require.main === module) {
  const prisma = createPrisma();
  readFile(PAGES_FILE, "utf8")
    .then((text) => importWikimonInfo(prisma, JSON.parse(text) as PageCache))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
