import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createPrisma } from "./client";
import { PAGES_FILE, wikimonTitle, type PageCache } from "./fetch-wikimon";

const API = "https://wikimon.net/api.php";
const UA = "digimon-database-importer";
const ART_DIR = path.join(__dirname, "..", "public", "art");
const THUMB_DIR = path.join(ART_DIR, "s");
const CREDIT = "Arte oficial © Bandai — via Wikimon";
const FULL = 800;
const THUMB = 240;
const PAUSE = 300;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, tries = 4): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (i >= tries) throw e;
      await wait(2000 * i);
    }
  }
}

function infoboxImage(text: string) {
  const hit = text.match(/^\s*\|\s*image\s*=\s*([^\n|{}<]+)/m);
  const file = hit?.[1].trim().replace(/^(File|Image):/i, "");
  return file && /\.(jpe?g|png|webp|gif)$/i.test(file) ? file : null;
}

async function fileUrls(files: string[]) {
  const urls = new Map<string, string>();
  for (let i = 0; i < files.length; i += 50) {
    const asked = files.slice(i, i + 50).map((f) => `File:${f}`);
    const qs = new URLSearchParams({ action: "query", format: "json", formatversion: "2", prop: "imageinfo", iiprop: "url", redirects: "1", titles: asked.join("|") });
    const json = await (await get(`${API}?${qs}`)).json();
    const alias = new Map<string, string>(asked.map((t) => [t, t]));
    for (const list of [json.query?.normalized, json.query?.redirects]) {
      for (const { from, to } of list ?? []) for (const [k, v] of alias) if (v === from) alias.set(k, to);
    }
    const byTitle = new Map<string, string>();
    for (const p of json.query?.pages ?? []) if (p.imageinfo?.[0]?.url) byTitle.set(p.title, p.imageinfo[0].url);
    for (const t of asked) {
      const url = byTitle.get(alias.get(t)!);
      if (url) urls.set(t.slice(5), url);
    }
    await wait(PAUSE);
  }
  return urls;
}

const exists = (f: string) => access(f).then(() => true, () => false);

async function main() {
  const cache = JSON.parse(await readFile(PAGES_FILE, "utf8")) as PageCache;
  const db = createPrisma();
  await mkdir(THUMB_DIR, { recursive: true });
  const all = await db.digimon.findMany({ select: { id: true, slug: true, name: true, imageUrl: true }, orderBy: { number: "asc" } });
  const todo = all.filter((d) => !d.imageUrl || d.imageUrl.includes("digi-api.com") || d.imageUrl.startsWith("/art/"));

  const wanted = new Map<number, string>();
  for (const d of todo) {
    const title = wikimonTitle(cache, d.name);
    const file = title ? infoboxImage(cache.pages[title] ?? "") : null;
    if (file) wanted.set(d.id, file);
  }
  console.log(`Arte no Wikimon: ${wanted.size} de ${todo.length} Digimon. Buscando os endereços...`);
  const urls = await fileUrls([...new Set(wanted.values())]);

  let done = 0;
  let skipped = 0;
  const failed: string[] = [];
  for (const d of todo) {
    const url = urls.get(wanted.get(d.id) ?? "");
    if (!url) {
      failed.push(d.name);
      continue;
    }
    const full = path.join(ART_DIR, `${d.slug}.avif`);
    const thumb = path.join(THUMB_DIR, `${d.slug}.avif`);
    try {
      if (await exists(full) && await exists(thumb)) {
        skipped++;
      } else {
        const src = Buffer.from(await (await get(url)).arrayBuffer());
        const img = () => sharp(src).flatten({ background: "#ffffff" });
        await writeFile(full, await img().resize(FULL, FULL, { fit: "inside", withoutEnlargement: true }).avif({ quality: 55, effort: 4 }).toBuffer());
        await writeFile(thumb, await img().resize(THUMB, THUMB, { fit: "inside", withoutEnlargement: true }).avif({ quality: 55, effort: 4 }).toBuffer());
        await wait(PAUSE);
      }
      await db.digimon.update({ where: { id: d.id }, data: { imageUrl: `/art/${d.slug}.avif`, imageCredit: CREDIT } });
      done++;
      if (done % 100 === 0) console.log(`  ${done} prontas`);
    } catch (e) {
      failed.push(`${d.name} (${(e as Error).message})`);
    }
  }
  await db.$disconnect();
  console.log(`Artes do Wikimon: ${done} (${skipped} já existiam). Mantidas como estavam: ${failed.length}${failed.length ? ` (${failed.slice(0, 30).join(", ")}${failed.length > 30 ? "..." : ""})` : ""}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
