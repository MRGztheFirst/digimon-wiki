import { readFile } from "node:fs/promises";
import { createPrisma } from "./client";
import { MEDIA_FILE, PAGES_FILE, type MediaCache, type PageCache } from "./fetch-wikimon";

const prisma = createPrisma();

const SOURCE_TITLE = "Wikimon — evoluções por obra";
const DCG = "digimon-card-game";
const CLASSIC_CARDS = "digimon-card-classic";

type Spec = { slug: string; name: string; kind: string };

const NEW_MEDIA: Record<string, Spec> = {
  [CLASSIC_CARDS]: { slug: CLASSIC_CARDS, name: "Digimon Card Game (1999–2009)", kind: "card" },
  appmon: { slug: "digimon-universe-appli-monsters", name: "Digimon Universe: Appli Monsters", kind: "anime" },
  beatbreak: { slug: "digimon-beatbreak", name: "Digimon Beatbreak", kind: "anime" },
};

const EPISODE_CODES: Record<string, string> = {
  DA: "digimon-adventure",
  "DA:": "digimon-adventure-2020",
  ZT: "digimon-adventure-02",
  DT: "digimon-tamers",
  DF: "digimon-frontier",
  DS: "digimon-savers",
  XW: "digimon-xros-wars",
  GG: "digimon-ghost-game",
  APM: NEW_MEDIA.appmon.slug,
  DB: NEW_MEDIA.beatbreak.slug,
};

const TITLE_ALIASES: Record<string, string> = {
  "Digimon Adventure:": "digimon-adventure-2020",
  "Digimon Masters": "digimon-masters-online",
  "Digimon World -next 0rder-": "digimon-world-next-order",
  "Digimon Story: Cyber Sleuth Hacker's Memory": "digimon-story-hackers-memory",
  "Digimon Card Game": DCG,
  "Digimon Story: Sunburst": "digimon-story-sunburst-moonlight",
  "Digimon Story: Moonlight": "digimon-story-sunburst-moonlight",
  "Digimon World -next 0rder- International Edition": "digimon-world-next-order",
  "Digimon Adventure: Our War Game!": "bokura-no-war-game",
};

const SKIP = new Set(["V Jump", "Nyalra × Kaeru DX Sloppy Otaku Talk DX"]);

const TITLE_KINDS: Record<string, string> = {
  "Digimon Story: Super Xros Wars": "game",
  "Digimon ReCollection": "game",
  "Digimon Story: Super Xros Wars Blue": "game",
  "Digimon Story: Super Xros Wars Red": "game",
  "Digimon Adventure tri.": "movie",
};

const KIND_COLORS: Record<string, string> = {
  anime: "#f97316",
  movie: "#ef4444",
  manga: "#ec4899",
  game: "#22c55e",
  vpet: "#eab308",
  card: "#a855f7",
};

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function section(text: string, heading: string) {
  const start = text.search(new RegExp(`\\n==\\s*${heading}\\s*==\\s*\\n`));
  if (start < 0) return "";
  const rest = text.slice(start + 1);
  const end = rest.slice(2).search(/\n==[^=]/);
  return end < 0 ? rest : rest.slice(0, end + 2);
}

function refDefinitions(text: string) {
  const defs = new Map<string, string>();
  for (const m of text.matchAll(/<ref\s+name\s*=\s*"?([^">\/]+?)"?\s*>([\s\S]*?)<\/ref>/g)) {
    if (!defs.has(m[1].trim())) defs.set(m[1].trim(), m[2]);
  }
  return defs;
}

const STAT_GAMES: [RegExp, string][] = [
  [/Sunburst/, "sunburst-moonlight"],
  [/Super Xros Wars/, "super-xros-wars"],
];
const STAT_COLUMNS: Record<string, string> = {
  HP: "hp",
  MP: "mp",
  ATK: "atk",
  STR: "atk",
  DEF: "def",
  SPI: "spi",
  INT: "spi",
  SPD: "spd",
  APT: "apt",
  "Max Lv": "maxLevel",
  "Strong Element": "strong",
  Strong: "strong",
  "Weak Element": "weak",
  Weak: "weak",
};
const GAMEPLAY = /''([^'\n]+?)'' Gameplay Data/g;

type StatRow = { hp?: number | null; mp?: number | null; atk?: number | null; def?: number | null; spi?: number | null; spd?: number | null; apt?: number | null; maxLevel?: number | null; strong?: string | null; weak?: string | null };

const statCell = (line: string) =>
  line
    .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<br\s*\/?>/gi, ",")
    .replace(/^[!|]\s*/, "")
    .split("|")
    .pop()!
    .trim();

function parseStats(block: string): StatRow | null {
  const at = block.indexOf("Base Stats");
  if (at < 0) return null;
  const lines = block.slice(at).split("\n").slice(1);
  let i = 0;
  const skipSeparators = () => {
    while (i < lines.length && lines[i].trim() === "|-") i++;
  };
  skipSeparators();
  const heads: string[] = [];
  while (i < lines.length && lines[i].startsWith("!")) heads.push(statCell(lines[i++]));
  skipSeparators();
  const cells: string[] = [];
  while (i < lines.length && lines[i].startsWith("|") && !/^\|[-}]/.test(lines[i])) cells.push(statCell(lines[i++]));
  if (!heads.length || heads.length !== cells.length) return null;
  const row: Record<string, number | string | null> = {};
  heads.forEach((h, k) => {
    const col = STAT_COLUMNS[h];
    if (!col) return;
    if (col === "strong" || col === "weak") {
      row[col] = cells[k].split(",").map((s) => s.trim()).filter((s) => s && s !== "-" && !/^none$/i.test(s)).join(", ") || null;
    } else {
      const num = parseInt(cells[k].replace(/[^\d]/g, ""), 10);
      row[col] = Number.isFinite(num) ? num : null;
    }
  });
  return Object.values(row).some((v) => typeof v === "number") ? (row as StatRow) : null;
}

const REF = /<ref\s+name\s*=\s*"?([^">\/]+?)"?\s*\/>|<ref(?:\s+name\s*=\s*"?[^">\/]+?"?)?\s*>([\s\S]*?)<\/ref>|\{\{ref\|((?:[^{}]|\{\{[^{}]*\}\})*)\}\}|\{\{rfc\|([^|}]+)\|([^|}]*)[^}]*\}\}|\{\{rfe\|([^|}]+)\|[^}]*\}\}/g;
const LINK = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/;

async function main() {
  const pages = JSON.parse(await readFile(PAGES_FILE, "utf8")) as PageCache;
  const mediaCache = JSON.parse(await readFile(MEDIA_FILE, "utf8")) as MediaCache;

  const wikimon = await prisma.source.findFirst({ where: { kind: "wikimon", title: "Wikimon" } });
  if (!wikimon) throw new Error('Fonte "Wikimon" não encontrada. Rode "npm run db:seed" antes.');
  const source =
    (await prisma.source.findFirst({ where: { title: SOURCE_TITLE } })) ??
    (await prisma.source.create({ data: { title: SOURCE_TITLE, url: "https://wikimon.net", publisher: "Comunidade Wikimon", kind: "wikimon", notes: "Listas Evolves From / Evolves To de cada Digimon, com a obra citada em cada referência." } }));

  await prisma.evolutionContext.deleteMany({ where: { sourceId: source.id } });
  await prisma.evolution.deleteMany({ where: { sourceId: source.id, imported: true } });
  await prisma.media.deleteMany({ where: { imported: true } });

  const digimon = await prisma.digimon.findMany({ select: { id: true, name: true, otherNames: true } });
  const byTitle = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const d of digimon) {
    const title = pages.titles[d.name];
    if (title && (!byTitle.has(norm(title)) || norm(title) === norm(d.name))) byTitle.set(norm(title), d.id);
    for (const n of [d.name, ...(d.otherNames?.split(",") ?? [])]) if (n.trim() && !byName.has(norm(n))) byName.set(norm(n), d.id);
  }
  const digimonId = (title: string) => byTitle.get(norm(title)) ?? byName.get(norm(title));

  const media = await prisma.media.findMany({ select: { id: true, slug: true, name: true } });
  const mediaBySlug = new Map(media.map((m) => [m.slug, m.id]));
  const existingByName = new Map(media.map((m) => [norm(m.name), m.slug]));
  const specs = new Map<string, Spec>();
  const skipped = new Map<string, number>();

  const specFor = (slug: string, name: string, kind: string) => {
    if (!mediaBySlug.has(slug) && !specs.has(slug)) specs.set(slug, { slug, name, kind });
    return slug;
  };
  const known = (title: string, label?: string) => {
    for (const t of [title, label]) {
      if (!t) continue;
      if (TITLE_ALIASES[t]) return TITLE_ALIASES[t];
      const hit = existingByName.get(norm(t));
      if (hit) return hit;
    }
    return null;
  };

  const classify = (rawTitle: string, label?: string): string | null => {
    if (/^:?(file|image):/i.test(rawTitle)) return null;
    if (/\(DCG\)/.test(rawTitle)) return DCG;
    const info = mediaCache[rawTitle];
    const title = info?.title || rawTitle;
    const cats = info?.categories ?? [];
    const named = /^[A-Z0-9-]{1,6}$/.test(title) && label ? label.replace(/'+/g, "").trim() : title;
    if (SKIP.has(title)) return null;
    const direct = known(title, label) ?? known(rawTitle);
    if (direct) return direct;
    if (/Carddass/.test(title) || cats.some((c) => /Cards?\b/.test(c))) return specFor(CLASSIC_CARDS, NEW_MEDIA[CLASSIC_CARDS].name, "card");
    const series = cats.find((c) => / (episodes|chapters)$/.test(c));
    if (series) {
      const name = series.replace(/ (episodes|chapters)$/, "");
      return known(name) ?? specFor(slugify(name), name, TITLE_KINDS[name] ?? (series.endsWith("episodes") ? "anime" : "manga"));
    }
    const forced = TITLE_KINDS[title] ?? (/\(Manga\)$/.test(title) ? "manga" : null);
    if (forced) return specFor(slugify(named.replace(/ (Blue|Red)$/, "")), named.replace(/ (Blue|Red)$/, ""), forced);
    if (cats.includes("Virtual Pets")) return specFor(slugify(named), named, "vpet");
    if (cats.includes("Video Games") || cats.some((c) => / Games$/.test(c))) return specFor(slugify(named), named, "game");
    if (cats.includes("Movies")) return specFor(slugify(named), named, "movie");
    if (cats.some((c) => c === "Manga" || c === "Manhua" || c === "Web Novel")) return specFor(slugify(named), named, "manga");
    skipped.set(title, (skipped.get(title) ?? 0) + 1);
    return null;
  };

  const fromContent = (content: string) => {
    const link = content.match(LINK);
    return link ? classify(link[1].trim(), link[2]?.trim()) : null;
  };

  const found = new Map<string, { from: number; to: number; media: Set<string>; notes: Set<string> }>();
  const unknownTargets = new Set<string>();
  const unknownCodes = new Set<string>();
  const seenTitles = new Set<string>();

  for (const [title, text] of Object.entries(pages.pages)) {
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    const self = byTitle.get(norm(title));
    if (!self) continue;
    const defs = refDefinitions(text);
    for (const [heading, dir] of [["Evolves From", "from"], ["Evolves To", "to"]] as const) {
      for (const line of section(text, heading).split("\n")) {
        if (!line.startsWith("*")) continue;
        const firstRef = line.search(/<ref|\{\{/);
        const head = firstRef < 0 ? line : line.slice(0, firstRef);
        const link = head.match(LINK);
        if (!link || link[1].includes("#") || /\bAny\b/.test(head.slice(0, link.index))) continue;
        const other = digimonId(link[1].trim());
        if (!other) {
          unknownTargets.add(link[1].trim());
          continue;
        }
        if (other === self) continue;
        const note = head.slice((link.index ?? 0) + link[0].length).match(/\((.+)\)/)?.[1].replace(/'''?|\[\[[^\]|]*\||\[\[|\]\]/g, "").trim();
        const slugs = new Set<string>();
        for (const m of line.matchAll(REF)) {
          let slug: string | null = null;
          if (m[1]) slug = defs.has(m[1].trim()) ? fromContent(defs.get(m[1].trim())!) : null;
          else if (m[2] !== undefined) slug = fromContent(m[2]);
          else if (m[3] !== undefined) slug = fromContent(m[3]);
          else if (m[4]) slug = /DCG/.test(m[5] ?? "") ? DCG : specFor(CLASSIC_CARDS, NEW_MEDIA[CLASSIC_CARDS].name, "card");
          else if (m[6]) {
            const code = m[6].trim();
            const target = EPISODE_CODES[code];
            if (!target) unknownCodes.add(code);
            else {
              const extra = Object.values(NEW_MEDIA).find((s) => s.slug === target);
              slug = extra ? specFor(extra.slug, extra.name, extra.kind) : target;
            }
          }
          if (slug) slugs.add(slug);
        }
        if (!slugs.size) continue;
        const [from, to] = dir === "from" ? [other, self] : [self, other];
        const key = `${from}>${to}`;
        const entry = found.get(key) ?? { from, to, media: new Set<string>(), notes: new Set<string>() };
        slugs.forEach((s) => entry.media.add(s));
        if (note) entry.notes.add(note);
        found.set(key, entry);
      }
    }
  }

  for (const s of specs.values()) {
    const created = await prisma.media.create({
      data: { slug: s.slug, name: s.name, kind: s.kind, color: KIND_COLORS[s.kind] ?? "#6366f1", imported: true },
    });
    mediaBySlug.set(s.slug, created.id);
  }

  const edges = await prisma.evolution.findMany({ select: { id: true, fromId: true, toId: true } });
  const edgesByPair = new Map<string, number[]>();
  for (const e of edges) {
    const key = `${e.fromId}>${e.toId}`;
    edgesByPair.set(key, [...(edgesByPair.get(key) ?? []), e.id]);
  }

  const missing = [...found.entries()].filter(([key]) => !edgesByPair.has(key));
  for (let i = 0; i < missing.length; i += 500) {
    await prisma.evolution.createMany({
      data: missing.slice(i, i + 500).map(([, f]) => ({
        fromId: f.from,
        toId: f.to,
        kind: "normal",
        status: "official",
        requirements: f.notes.size ? [...f.notes].join(" / ") : null,
        sourceId: source.id,
        imported: true,
      })),
    });
  }
  if (missing.length) {
    const created = await prisma.evolution.findMany({ where: { sourceId: source.id, imported: true }, select: { id: true, fromId: true, toId: true } });
    for (const e of created) edgesByPair.set(`${e.fromId}>${e.toId}`, [e.id]);
  }

  const taken = new Set((await prisma.evolutionContext.findMany({ select: { evolutionId: true, mediaId: true } })).map((c) => `${c.evolutionId}:${c.mediaId}`));
  const rows: { evolutionId: number; mediaId: number; status: string; sourceId: number }[] = [];
  for (const [key, f] of found) {
    for (const evolutionId of edgesByPair.get(key) ?? []) {
      for (const slug of f.media) {
        const mediaId = mediaBySlug.get(slug);
        if (!mediaId || taken.has(`${evolutionId}:${mediaId}`)) continue;
        taken.add(`${evolutionId}:${mediaId}`);
        rows.push({ evolutionId, mediaId, status: "media", sourceId: source.id });
      }
    }
  }
  for (let i = 0; i < rows.length; i += 2000) await prisma.evolutionContext.createMany({ data: rows.slice(i, i + 2000) });

  const stats = new Map<string, StatRow & { digimonId: number; game: string }>();
  for (const [title, text] of Object.entries(pages.pages)) {
    const self = byTitle.get(norm(title));
    if (!self) continue;
    const marks = [...text.matchAll(GAMEPLAY)];
    marks.forEach((m, k) => {
      const game = STAT_GAMES.find(([re]) => re.test(m[1]))?.[1];
      if (!game || stats.has(`${self}:${game}`)) return;
      const parsed = parseStats(text.slice(m.index, marks[k + 1]?.index ?? text.length));
      if (parsed) stats.set(`${self}:${game}`, { ...parsed, digimonId: self, game });
    });
  }
  await prisma.gameStats.deleteMany({ where: { game: { in: STAT_GAMES.map(([, g]) => g) } } });
  const statRows = [...stats.values()];
  for (let i = 0; i < statRows.length; i += 500) await prisma.gameStats.createMany({ data: statRows.slice(i, i + 500) });

  const withContext = await prisma.evolution.count({ where: { contexts: { some: {} } } });
  const total = await prisma.evolution.count();
  console.log(`Obras novas: ${specs.size}. Ligações lidas no Wikimon: ${found.size} (${missing.length} não existiam e foram criadas).`);
  console.log(`Contextos por obra criados: ${rows.length}. Evoluções com obra definida: ${withContext} de ${total}.`);
  if (unknownCodes.size) console.log(`Códigos de episódio sem mapa: ${[...unknownCodes].join(", ")}`);
  console.log(`Digimon citados sem cadastro: ${unknownTargets.size}.`);
  console.log(`Status base por jogo: ${STAT_GAMES.map(([, g]) => `${g} ${statRows.filter((r) => r.game === g).length}`).join(", ")}.`);
  const topSkipped = [...skipped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  if (topSkipped.length) console.log(`Referências ignoradas (não são jogo/anime/V-Pet/card): ${topSkipped.map(([t, n]) => `${t} (${n})`).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
