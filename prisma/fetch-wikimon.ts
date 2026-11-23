import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const API = "https://wikimon.net/api.php";
export const WIKIMON_DIR = path.join(__dirname, ".cache", "wikimon");
export const PAGES_FILE = path.join(WIKIMON_DIR, "pages.json");
export const MEDIA_FILE = path.join(WIKIMON_DIR, "media.json");
const BATCH = 20;
const PAUSE = 800;

export type PageCache = { titles: Record<string, string>; pages: Record<string, string> };
export type MediaCache = Record<string, { title: string; categories: string[] }>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>, tries = 5): Promise<any> {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params });
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(`${API}?${qs}`, { headers: { "User-Agent": "digimon-database-importer" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.info ?? json.error.code);
      return json;
    } catch (e) {
      if (i >= tries) throw e;
      await wait(2000 * i);
    }
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function resolveTitles(json: any, asked: string[]) {
  const map = new Map(asked.map((t) => [t, t]));
  const step = (list: { from: string; to: string }[] | undefined) => {
    for (const { from, to } of list ?? []) for (const [k, v] of map) if (v === from) map.set(k, to);
  };
  step(json.query?.normalized);
  step(json.query?.redirects);
  return map;
}

export function mediaTitles(cache: PageCache) {
  const titles = new Set<string>();
  const link = /\[\[([^\]|#]+)(?:[^\]]*)\]\]/;
  for (const text of Object.values(cache.pages)) {
    for (const m of text.matchAll(/<ref(?:\s+name\s*=\s*"?[^>"/]+"?)?\s*>([\s\S]*?)<\/ref>|\{\{ref\|([\s\S]*?)\}\}(?!\})/g)) {
      const hit = (m[1] ?? m[2] ?? "").match(link);
      if (hit) titles.add(hit[1].trim());
    }
  }
  return [...titles];
}

async function fetchPages(names: string[]) {
  const cache = await readJson<PageCache>(PAGES_FILE, { titles: {}, pages: {} });
  const todo = names.filter((n) => !(n in cache.titles));
  console.log(`Wikimon: ${names.length} Digimon, ${names.length - todo.length} já no cache, baixando ${todo.length}...`);
  for (let i = 0; i < todo.length; i += BATCH) {
    const asked = todo.slice(i, i + BATCH);
    const json = await api({ action: "query", prop: "revisions", rvprop: "content", rvslots: "main", redirects: "1", titles: asked.join("|") });
    const resolved = resolveTitles(json, asked);
    const pages = new Map<string, string>();
    for (const p of json.query?.pages ?? []) {
      const text = p.revisions?.[0]?.slots?.main?.content;
      if (typeof text === "string") pages.set(p.title, text);
    }
    for (const name of asked) {
      const title = resolved.get(name)!;
      cache.titles[name] = pages.has(title) ? title : "";
      if (pages.has(title)) cache.pages[title] = pages.get(title)!;
    }
    await writeFile(PAGES_FILE, JSON.stringify(cache));
    if ((i / BATCH) % 10 === 9) console.log(`  ${Math.min(i + BATCH, todo.length)} de ${todo.length}`);
    await wait(PAUSE);
  }
  const alt = (n: string) => n.replace(/\s*\(([^()]+)\)$/, ": $1");
  const retry = Object.entries(cache.titles).filter(([n, t]) => !t && alt(n) !== n).map(([n]) => n);
  for (let i = 0; i < retry.length; i += BATCH) {
    const names = retry.slice(i, i + BATCH);
    const asked = names.map(alt);
    const json = await api({ action: "query", prop: "revisions", rvprop: "content", rvslots: "main", redirects: "1", titles: asked.join("|") });
    const resolved = resolveTitles(json, asked);
    for (const p of json.query?.pages ?? []) {
      const text = p.revisions?.[0]?.slots?.main?.content;
      if (typeof text === "string") cache.pages[p.title] = text;
    }
    names.forEach((n, j) => {
      const title = resolved.get(asked[j])!;
      if (cache.pages[title]) cache.titles[n] = title;
    });
    await writeFile(PAGES_FILE, JSON.stringify(cache));
    await wait(PAUSE);
  }
  const missing = Object.entries(cache.titles).filter(([, t]) => !t).map(([n]) => n);
  if (missing.length) console.log(`Sem página no Wikimon (${missing.length}): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`);
  return cache;
}

async function fetchMedia(pages: PageCache) {
  const cache = await readJson<MediaCache>(MEDIA_FILE, {});
  const todo = mediaTitles(pages).filter((t) => !(t in cache));
  console.log(`Obras citadas: ${Object.keys(cache).length + todo.length}, buscando categorias de ${todo.length}...`);
  for (let i = 0; i < todo.length; i += 50) {
    const asked = todo.slice(i, i + 50);
    const json = await api({ action: "query", prop: "categories", cllimit: "max", redirects: "1", titles: asked.join("|") });
    const resolved = resolveTitles(json, asked);
    const cats = new Map<string, string[]>();
    for (const p of json.query?.pages ?? []) cats.set(p.title, (p.categories ?? []).map((c: { title: string }) => c.title.replace(/^Category:/, "")));
    for (const t of asked) {
      const title = resolved.get(t)!;
      cache[t] = { title, categories: cats.get(title) ?? [] };
    }
    await writeFile(MEDIA_FILE, JSON.stringify(cache));
    await wait(PAUSE);
  }
}

async function main() {
  await mkdir(WIKIMON_DIR, { recursive: true });
  const db = new PrismaClient();
  const names = (await db.digimon.findMany({ select: { name: true } })).map((d) => d.name);
  await db.$disconnect();
  const pages = await fetchPages(names);
  await fetchMedia(pages);
  console.log("Download do Wikimon concluído.");
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
