import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPrisma } from "./client";
import { PAGES_FILE, type PageCache } from "./fetch-wikimon";

const prisma = createPrisma();

const SITE = "https://tamerdex.com";
const CACHE_DIR = path.join(__dirname, ".cache", "tamerdex");
const GAMES = [
  { key: "cyber-sleuth", path: "digimon-story-cyber-sleuth" },
  { key: "time-stranger", path: "digimon-story-time-stranger" },
];
const COLUMNS: Record<string, "hp" | "mp" | "atk" | "def" | "spi" | "spd"> = { hp: "hp", sp: "mp", atk: "atk", def: "def", int: "spi", spd: "spd" };
const RECORD = /\{name:"((?:[^"\\]|\\.)*)",num:\d+(?:(?!name:")[\s\S])*?stats:\{((?:[^{}]|\{[^{}]*\})*)\}/g;
const STAT = /(\w+):(?:\{base:(\d+)|(\d+))/g;

const ALIASES: Record<string, string> = { Huckmon: "Hackmon" };
const SUFFIXES: Record<string, string[]> = {
  BM: ["Burst Mode", "Blast Mode"],
  FM: ["Fighter Mode", "Falldown Mode"],
  DM: ["Dragon Mode", "Destroy Mode", "Desperado Mode"],
  PM: ["Paladin Mode"],
  CM: ["Crimson Mode", "Chaos Mode"],
  SM: ["Sleep Mode", "Satan Mode"],
  RM: ["Rage Mode"],
  LM: ["Leopard Mode"],
  HM: ["Holy Mode", "Hysteric Mode"],
  WM: ["Werewolf Mode", "Wrath Mode"],
  VA: ["Valdur Arm"],
  Blk: ["(Black)", "Black"],
};

const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(game: (typeof GAMES)[number]) {
  const file = path.join(CACHE_DIR, `${game.key}.js`);
  if (await exists(file)) return readFile(file, "utf8");
  const headers = { "User-Agent": "digimon-database-importer" };
  const page = await (await fetch(`${SITE}/${game.path}/`, { headers })).text();
  const src = page.match(new RegExp(`src="(/${game.path}/app\\.js[^"]*)"`))?.[1];
  if (!src) throw new Error(`app.js não encontrado em ${SITE}/${game.path}/`);
  const res = await fetch(`${SITE}${src}`, { headers });
  if (!res.ok) throw new Error(`${SITE}${src}: HTTP ${res.status}`);
  const js = await res.text();
  await writeFile(file, js);
  return js;
}

function parse(js: string) {
  const start = js.indexOf("const DIGIDEX=");
  if (start < 0) throw new Error("Tabela DIGIDEX não encontrada.");
  const records: { name: string; stats: Partial<Record<(typeof COLUMNS)[string], number>> }[] = [];
  for (const m of js.slice(start).matchAll(RECORD)) {
    const stats: Partial<Record<(typeof COLUMNS)[string], number>> = {};
    for (const s of m[2].matchAll(STAT)) {
      const col = COLUMNS[s[1].toLowerCase()];
      if (col) stats[col] = Number(s[2] ?? s[3]);
    }
    if (Object.keys(stats).length) records.push({ name: m[1], stats });
  }
  return records;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  const pages = (await exists(PAGES_FILE)) ? (JSON.parse(await readFile(PAGES_FILE, "utf8")) as PageCache) : null;
  const digimon = await prisma.digimon.findMany({ select: { id: true, name: true, otherNames: true } });
  const byName = new Map<string, number>();
  for (const d of digimon) if (!byName.has(norm(d.name))) byName.set(norm(d.name), d.id);
  for (const d of digimon) {
    const title = pages?.titles[d.name] ?? "";
    const text = pages?.pages[title] ?? "";
    const dubs = [...text.matchAll(/^\|dub\d*=([^\n{<[]+)/gm)].map((m) => m[1].trim());
    for (const n of [...(d.otherNames?.split(",") ?? []), title, ...dubs]) {
      if (n.trim() && !byName.has(norm(n))) byName.set(norm(n), d.id);
    }
  }

  const nameById = new Map(digimon.map((d) => [d.id, d.name]));
  const resolve = (raw: string) => {
    const direct = byName.get(norm(ALIASES[raw] ?? raw));
    if (direct) return direct;
    const m = raw.match(/^(.+?)\s+(?:\((\w+)\)|([A-Z]{2}))$/);
    const suffixes = m ? SUFFIXES[m[2] ?? m[3]] : undefined;
    if (!m || !suffixes) return undefined;
    const bases = [m[1], nameById.get(byName.get(norm(m[1])) ?? -1)].filter((b): b is string => !!b);
    for (const b of bases) {
      for (const s of suffixes) {
        const id = byName.get(norm(`${b} ${s}`)) ?? byName.get(norm(`${s} ${b}`));
        if (id) return id;
      }
    }
    return undefined;
  };

  await prisma.gameStats.deleteMany({ where: { game: { in: GAMES.map((g) => g.key) } } });
  for (const game of GAMES) {
    const records = parse(await download(game));
    const rows = new Map<number, { digimonId: number; game: string } & (typeof records)[number]["stats"]>();
    const unmatched: string[] = [];
    for (const r of records) {
      const id = resolve(r.name);
      if (!id) unmatched.push(r.name);
      else if (!rows.has(id)) rows.set(id, { digimonId: id, game: game.key, ...r.stats });
    }
    await prisma.gameStats.createMany({ data: [...rows.values()] });
    console.log(`${game.key}: ${records.length} Digimon lidos, ${rows.size} ligados ao banco.`);
    if (unmatched.length) console.log(`  Sem correspondência (${unmatched.length}): ${unmatched.slice(0, 25).join(", ")}${unmatched.length > 25 ? "..." : ""}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
