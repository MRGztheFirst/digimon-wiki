import { PrismaClient } from "@prisma/client";
import { readCache } from "./fetch-digiapi";

const prisma = new PrismaClient();
const CREDIT = "Arte oficial © Bandai — via Digi-API / Wikimon";

type ApiRef = { id: number; digimon: string; condition: string };
type ApiDigimon = {
  id: number;
  name: string;
  xAntibody: boolean;
  images: { href: string }[];
  levels: { level: string }[];
  types: { type: string }[];
  attributes: { attribute: string }[];
  fields: { field: string }[];
  releaseDate: string;
  descriptions: { origin: string; language: string; description: string }[];
  skills: { skill: string; translation: string; description: string }[];
  priorEvolutions: ApiRef[];
  nextEvolutions: ApiRef[];
};

const STAGES: Record<string, string> = {
  "Baby I": "em-treinamento-1",
  "Baby II": "em-treinamento-2",
  Child: "novato",
  Adult: "campeao",
  Perfect: "perfeito",
  Ultimate: "mega",
  Armor: "armor",
  Hybrid: "hibrido",
  "Super Ultimate": "supremo",
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
const NAME_OVERRIDES: Record<string, string> = {
  atlurkabuterimon: "Atlur Kabuterimon (Blue)",
  tsunomon: "Tunomon",
  pinocchimon: "Pinochimon",
  ogremon: "Orgemon",
  rapidmon: "Rapidmon Perfect",
};
const X_SUFFIX = " (X-Antibody)";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const wikimonUrl = (name: string) => `https://wikimon.net/${encodeURIComponent(name.replace(/ /g, "_"))}`;
const unknownValues = new Map<string, Set<string>>();
const noteUnknown = (kind: string, v: string) => {
  if (!unknownValues.has(kind)) unknownValues.set(kind, new Set());
  unknownValues.get(kind)!.add(v);
};

function pickProfile(d: ApiDigimon, lang: string) {
  const all = d.descriptions.filter((x) => x.language === lang && x.description?.trim());
  const pick = all.find((x) => x.origin === "reference_book_current") ?? all.find((x) => x.origin === "reference_book");
  return pick?.description.trim() ?? null;
}

function attackDescription(s: ApiDigimon["skills"][number]) {
  const desc = s.description?.trim() || null;
  const tr = s.translation?.trim();
  if (!tr) return desc;
  return desc ? `“${tr}” — ${desc}` : `“${tr}”`;
}

async function main() {
  const list = await readCache<{ id: number; name: string }[]>("_list.json");
  const api: ApiDigimon[] = [];
  for (const { id } of list) {
    try {
      api.push(await readCache<ApiDigimon>(`${id}.json`));
    } catch {
      console.warn(`Sem cache para o id ${id}; rode "npm run db:fetch" de novo.`);
    }
  }
  console.log(`${api.length} Digimon no cache.`);

  const [stages, attrs, families, types, sources] = await Promise.all([
    prisma.stage.findMany(),
    prisma.attribute.findMany(),
    prisma.family.findMany(),
    prisma.digimonType.findMany(),
    prisma.source.findMany(),
  ]);
  const stageId = new Map(stages.map((s) => [s.slug, s.id]));
  const stageSlugById = new Map(stages.map((s) => [s.id, s.slug]));
  const attrId = new Map(attrs.map((a) => [a.slug, a.id]));
  const famId = new Map(families.map((f) => [f.slug, f.id]));
  const typeId = new Map(types.map((t) => [norm(t.name), t.id]));
  const wikimon = sources.find((s) => s.kind === "wikimon" && s.title === "Wikimon")?.id;
  const refbook = sources.find((s) => s.kind === "reference-book")?.id;
  if (!wikimon || !refbook) throw new Error('Fontes "Wikimon" e "Reference Book" não encontradas. Rode "npm run db:seed" antes.');

  for (const d of api) {
    for (const t of d.types) {
      const key = norm(t.type);
      if (!t.type.trim() || typeId.has(key)) continue;
      let slug = slugify(t.type);
      if (types.some((x) => x.slug === slug)) slug = `${slug}-${key.length}`;
      const created = await prisma.digimonType.create({ data: { slug, name: t.type.trim() } });
      types.push(created);
      typeId.set(key, created.id);
    }
  }

  const existing = await prisma.digimon.findMany({
    include: { types: true, families: true, attacks: { select: { name: true } } },
  });
  const byName = new Map<string, (typeof existing)[number]>();
  for (const e of existing) {
    for (const n of [NAME_OVERRIDES[e.slug], e.name, ...(e.otherNames?.split(",") ?? []), e.romaji]) {
      if (n && !byName.has(norm(n))) byName.set(norm(n), e);
    }
  }
  const usedSlugs = new Set(existing.map((e) => e.slug));
  let nextNumber = Math.max(0, ...existing.map((e) => e.number)) + 1;

  const apiToDb = new Map<number, number>();
  const dbStage = new Map<number, string | null>();
  let created = 0;
  let merged = 0;

  for (const d of api) {
    const levels = d.levels.map((l) => l.level);
    const stageSlug = levels.map((l) => STAGES[l]).find(Boolean) ?? null;
    levels.filter((l) => !STAGES[l] && l !== "Unknown").forEach((l) => noteUnknown("estágio", l));
    const attrSlug = d.attributes.map((a) => ATTRS[a.attribute]).find(Boolean) ?? null;
    d.attributes.filter((a) => !ATTRS[a.attribute]).forEach((a) => noteUnknown("atributo", a.attribute));
    const famSlugs = [...new Set(d.fields.map((f) => slugify(f.field)))].filter((s) => {
      if (!famId.has(s)) noteUnknown("família", s);
      return famId.has(s);
    });
    const typeIds = [...new Set(d.types.map((t) => typeId.get(norm(t.type))).filter((x): x is number => !!x))];
    const year = /^\d{4}$/.test(d.releaseDate?.trim() ?? "") ? Number(d.releaseDate.trim()) : null;
    const image = d.images[0]?.href ?? null;
    const profileJp = pickProfile(d, "jap");
    const profileEn = pickProfile(d, "en_us");
    const attacks = d.skills.filter((s) => s.skill?.trim());

    const match = byName.get(norm(d.name));
    if (match && !apiToDb.has(d.id) && ![...apiToDb.values()].includes(match.id)) {
      const known = new Set(match.attacks.map((a) => norm(a.name)));
      const newAttacks = attacks.filter((s) => !known.has(norm(s.skill)));
      await prisma.digimon.update({
        where: { id: match.id },
        data: {
          apiId: d.id,
          profileJp: match.profileJp ?? profileJp,
          profileEn: match.profileEn ?? profileEn,
          firstYear: match.firstYear ?? year,
          stageId: match.stageId ?? (stageSlug ? stageId.get(stageSlug) : undefined),
          attributeId: match.attributeId ?? (attrSlug ? attrId.get(attrSlug) : undefined),
          ...(image && (!match.imageUrl || match.imageUrl.includes("digi-api.com")) ? { imageUrl: image, imageCredit: CREDIT } : {}),
          types: match.types.length ? undefined : { create: typeIds.map((id) => ({ typeId: id })) },
          families: match.families.length
            ? undefined
            : { create: famSlugs.map((s) => ({ familyId: famId.get(s)!, status: "official", sourceId: wikimon })) },
          attacks: newAttacks.length
            ? {
                create: newAttacks.map((s, i) => ({
                  name: s.skill.trim(),
                  description: attackDescription(s),
                  status: "official",
                  sourceId: wikimon,
                  order: match.attacks.length + i,
                })),
              }
            : undefined,
        },
      });
      apiToDb.set(d.id, match.id);
      dbStage.set(match.id, match.stageId ? stageSlugById.get(match.stageId) ?? null : stageSlug);
      merged++;
      continue;
    }

    let slug = slugify(d.name) || `digimon-${d.id}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${d.id}`;
    usedSlugs.add(slug);
    const row = await prisma.digimon.create({
      data: {
        number: nextNumber++,
        apiId: d.id,
        slug,
        name: d.name.trim(),
        imageUrl: image,
        imageCredit: image ? CREDIT : null,
        profileJp,
        profileEn,
        firstYear: year,
        reviewStatus: "review",
        stageId: stageSlug ? stageId.get(stageSlug) : undefined,
        attributeId: attrSlug ? attrId.get(attrSlug) : undefined,
        types: { create: typeIds.map((id) => ({ typeId: id })) },
        families: { create: famSlugs.map((s) => ({ familyId: famId.get(s)!, status: "official", sourceId: wikimon })) },
        attacks: {
          create: attacks.map((s, order) => ({ name: s.skill.trim(), description: attackDescription(s), status: "official", sourceId: wikimon, order })),
        },
        citations: {
          create: [
            { sourceId: wikimon, field: "*", url: wikimonUrl(d.name), note: "Página na Wikimon (dados importados via Digi-API)" },
            ...(profileJp || profileEn ? [{ sourceId: refbook, field: "profile", note: "Perfil do Digimon Reference Book, conforme reproduzido na Wikimon" }] : []),
          ],
        },
      },
    });
    apiToDb.set(d.id, row.id);
    dbStage.set(row.id, stageSlug);
    created++;
  }
  console.log(`Digimon: ${created} novos, ${merged} já existentes completados.`);

  const nameToDb = new Map<string, number>();
  for (const d of api) {
    const id = apiToDb.get(d.id);
    if (id) nameToDb.set(d.name, id);
  }
  let variants = 0;
  for (const d of api) {
    if (!d.name.endsWith(X_SUFFIX)) continue;
    const id = apiToDb.get(d.id)!;
    const base = nameToDb.get(d.name.slice(0, -X_SUFFIX.length));
    if (!base) continue;
    const r = await prisma.digimon.updateMany({ where: { id, baseId: null }, data: { baseId: base, variantKind: "X-Antibody" } });
    variants += r.count;
  }
  console.log(`Variantes X-Antibody ligadas: ${variants}.`);

  const existingEdges = await prisma.evolution.findMany({ select: { fromId: true, toId: true } });
  const taken = new Set(existingEdges.map((e) => `${e.fromId}>${e.toId}`));
  const pending = new Map<string, { fromId: number; toId: number; conditions: Set<string> }>();
  const add = (fromApi: number, toApi: number, condition: string) => {
    const fromId = apiToDb.get(fromApi);
    const toId = apiToDb.get(toApi);
    if (!fromId || !toId || fromId === toId) return;
    const key = `${fromId}>${toId}`;
    if (taken.has(key)) return;
    const p = pending.get(key) ?? { fromId, toId, conditions: new Set<string>() };
    if (condition?.trim()) p.conditions.add(condition.trim());
    pending.set(key, p);
  };
  for (const d of api) {
    d.nextEvolutions.forEach((n) => add(d.id, n.id, n.condition));
    d.priorEvolutions.forEach((p) => add(p.id, d.id, p.condition));
  }

  const nameById = new Map<number, string>();
  for (const d of api) nameById.set(apiToDb.get(d.id)!, d.name);
  const rows = [...pending.values()].map((p) => {
    const fromName = nameById.get(p.fromId) ?? "";
    const toName = nameById.get(p.toId) ?? "";
    let kind = "normal";
    if (toName === fromName + X_SUFFIX) kind = "x-antibody";
    else if (dbStage.get(p.toId) === "armor" && dbStage.get(p.fromId) !== "armor") kind = "armor";
    return {
      fromId: p.fromId,
      toId: p.toId,
      kind,
      status: "unconfirmed",
      requirements: p.conditions.size ? [...p.conditions].join(" / ") : null,
      notes: "Listada na Wikimon (via Digi-API) sem indicar em qual obra acontece. Confira a página da Wikimon antes de tratar como oficial.",
      sourceId: wikimon,
      imported: true,
    };
  });
  for (let i = 0; i < rows.length; i += 500) {
    await prisma.evolution.createMany({ data: rows.slice(i, i + 500) });
  }
  console.log(`Evoluções importadas: ${rows.length}.`);

  for (const [kind, values] of unknownValues) console.log(`Valores de ${kind} sem correspondência: ${[...values].join(", ")}`);
  const counts = await Promise.all([prisma.digimon.count(), prisma.evolution.count(), prisma.attack.count(), prisma.digimonType.count()]);
  console.log(`Banco: ${counts[0]} Digimon, ${counts[1]} evoluções, ${counts[2]} golpes, ${counts[3]} tipos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
