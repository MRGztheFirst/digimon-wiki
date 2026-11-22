import { PrismaClient } from "@prisma/client";
import { stages, attributes, types, families, groups, sources } from "./seed-data/taxonomy";
import { media } from "./seed-data/media";
import { digimon } from "./seed-data/digimon";
import { evolutions, appearances } from "./seed-data/relations";

const prisma = new PrismaClient();

function wikimonSearch(q: string) {
  return `https://wikimon.net/index.php?search=${encodeURIComponent(q)}`;
}

async function main() {
  console.log("Limpando banco...");
  await prisma.$transaction([
    prisma.citation.deleteMany(),
    prisma.evolutionContext.deleteMany(),
    prisma.evolutionPartner.deleteMany(),
    prisma.evolution.deleteMany(),
    prisma.appearance.deleteMany(),
    prisma.attack.deleteMany(),
    prisma.ability.deleteMany(),
    prisma.trivia.deleteMany(),
    prisma.digimonTypeLink.deleteMany(),
    prisma.digimonFamily.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.digimon.deleteMany(),
    prisma.mediaFeature.deleteMany(),
    prisma.mediaStage.deleteMany(),
    prisma.media.deleteMany(),
    prisma.stage.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.digimonType.deleteMany(),
    prisma.family.deleteMany(),
    prisma.group.deleteMany(),
    prisma.source.deleteMany(),
  ]);

  console.log("Classificações...");
  const stageId = new Map<string, number>();
  for (const s of stages) stageId.set(s.slug, (await prisma.stage.create({ data: s })).id);
  const attrId = new Map<string, number>();
  for (const a of attributes) attrId.set(a.slug, (await prisma.attribute.create({ data: a })).id);
  const typeId = new Map<string, number>();
  for (const t of types) typeId.set(t.name, (await prisma.digimonType.create({ data: t })).id);
  const famId = new Map<string, number>();
  for (const f of families) famId.set(f.slug, (await prisma.family.create({ data: f })).id);
  const groupId = new Map<string, number>();
  for (const g of groups) groupId.set(g.slug, (await prisma.group.create({ data: g })).id);
  const srcId = new Map<string, number>();
  for (const { key, ...s } of sources) srcId.set(key, (await prisma.source.create({ data: s })).id);
  const wikimon = srcId.get("wikimon")!;
  const refbook = srcId.get("refbook")!;

  console.log("Mídias...");
  const mediaId = new Map<string, number>();
  const mediaSource = new Map<string, number>();
  for (const m of media) {
    const created = await prisma.media.create({
      data: {
        slug: m.slug, name: m.name, nameJp: m.nameJp, kind: m.kind, year: m.year, endYear: m.endYear,
        platform: m.platform, color: m.color, description: m.description,
        stages: m.stages ? { create: m.stages.map((s) => ({ stageId: stageId.get(s)! })) } : undefined,
      },
    });
    mediaId.set(m.slug, created.id);
    const src = await prisma.source.create({
      data: { title: `Wikimon — ${m.name}`, url: wikimonSearch(m.name), publisher: "Comunidade Wikimon", kind: "wikimon" },
    });
    mediaSource.set(m.slug, src.id);
    for (const [i, f] of (m.features ?? []).entries()) {
      await prisma.mediaFeature.create({
        data: { mediaId: created.id, category: f.category, title: f.title, body: f.body, status: f.status ?? "media", order: i, sourceId: src.id },
      });
    }
  }

  console.log("Digimon...");
  const digiId = new Map<string, number>();
  let n = 1;
  for (const d of digimon) {
    const created = await prisma.digimon.create({
      data: {
        number: n++,
        slug: d.slug,
        name: d.name,
        nameJp: d.jp,
        romaji: d.romaji,
        pronunciation: d.romaji,
        otherNames: d.other,
        summary: d.summary,
        nameMeaning: d.meaning,
        designOrigin: d.design,
        physical: d.physical,
        personality: d.personality,
        combat: d.combat,
        firstAppearance: d.first,
        firstYear: d.firstYear,
        featured: d.featured ?? false,
        reviewStatus: "review",
        stageId: stageId.get(d.stage),
        attributeId: d.attr ? attrId.get(d.attr) : undefined,
        types: d.types ? { create: d.types.map((t) => ({ typeId: typeId.get(t)! })) } : undefined,
        families: d.families
          ? { create: d.families.map(([f, status]) => ({ familyId: famId.get(f)!, status: status ?? "unconfirmed" })) }
          : undefined,
        groups: d.groups ? { create: d.groups.map(([g, role]) => ({ groupId: groupId.get(g)!, role })) } : undefined,
        attacks: d.attacks
          ? { create: d.attacks.map(([name, localizedName, description], order) => ({ name, localizedName, description, order, status: "official" })) }
          : undefined,
        abilities: d.abilities ? { create: d.abilities.map(([name, description]) => ({ name, description })) } : undefined,
        trivia: d.trivia ? { create: d.trivia.map(([text, status]) => ({ text, status: status ?? "official" })) } : undefined,
        citations: {
          create: [
            { sourceId: wikimon, field: "*", url: wikimonSearch(d.romaji?.replace(/\s/g, "") || d.name), note: "Página de referência na Wikimon" },
            { sourceId: refbook, field: "*", note: "Conferir perfil oficial no Digimon Reference Book" },
          ],
        },
      },
    });
    digiId.set(d.slug, created.id);
  }
  for (const d of digimon) {
    if (d.base) {
      await prisma.digimon.update({ where: { id: digiId.get(d.slug)! }, data: { baseId: digiId.get(d.base)!, variantKind: d.variantKind } });
    }
  }

  console.log("Evoluções...");
  const need = (slug: string) => {
    const id = digiId.get(slug);
    if (!id) throw new Error(`Digimon não encontrado no seed: ${slug}`);
    return id;
  };
  const needMedia = (slug: string) => {
    const id = mediaId.get(slug);
    if (!id) throw new Error(`Mídia não encontrada no seed: ${slug}`);
    return id;
  };
  for (const e of evolutions) {
    await prisma.evolution.create({
      data: {
        fromId: need(e.from),
        toId: need(e.to),
        kind: e.kind ?? "normal",
        status: e.status,
        requirements: e.requirements,
        notes: e.notes,
        sourceId: e.status === "official" ? refbook : wikimon,
        partners: e.partners ? { create: e.partners.map((p) => ({ digimonId: need(p) })) } : undefined,
        contexts: e.ctx
          ? {
              create: e.ctx.map(([m, req, notes, status]) => ({
                mediaId: needMedia(m),
                requirements: req ?? undefined,
                notes: notes ?? undefined,
                status: status ?? "media",
                sourceId: mediaSource.get(m),
              })),
            }
          : undefined,
      },
    });
  }

  console.log("Aparições...");
  for (const [d, m, role, form, status] of appearances) {
    await prisma.appearance.upsert({
      where: { digimonId_mediaId: { digimonId: need(d), mediaId: needMedia(m) } },
      update: {},
      create: {
        digimonId: need(d), mediaId: needMedia(m), role: role ?? undefined, form: form ?? undefined,
        status: status ?? "media", sourceId: mediaSource.get(m),
      },
    });
  }

  const counts = await Promise.all([prisma.digimon.count(), prisma.evolution.count(), prisma.appearance.count(), prisma.media.count()]);
  console.log(`Pronto: ${counts[0]} Digimon, ${counts[1]} evoluções, ${counts[2]} aparições, ${counts[3]} mídias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
