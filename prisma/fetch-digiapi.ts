import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const BASE = "https://digi-api.com/api/v1";
export const CACHE_DIR = path.join(__dirname, ".cache", "digi-api");
const CONCURRENCY = 6;

async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function getJson(url: string, tries = 4): Promise<unknown> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "digimon-database-importer" } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  const listFile = path.join(CACHE_DIR, "_list.json");
  const list = (await getJson(`${BASE}/digimon?pageSize=5000`)) as { content: { id: number; name: string }[] };
  await writeFile(listFile, JSON.stringify(list.content));
  const ids = list.content.map((d) => d.id);

  const todo: number[] = [];
  for (const id of ids) if (!(await exists(path.join(CACHE_DIR, `${id}.json`)))) todo.push(id);
  console.log(`Digi-API: ${ids.length} Digimon, ${ids.length - todo.length} já no cache, baixando ${todo.length}...`);

  let done = 0;
  const failed: number[] = [];
  async function worker() {
    while (todo.length) {
      const id = todo.shift()!;
      try {
        const data = await getJson(`${BASE}/digimon/${id}`);
        if (data) await writeFile(path.join(CACHE_DIR, `${id}.json`), JSON.stringify(data));
      } catch (e) {
        failed.push(id);
        console.warn((e as Error).message);
      }
      if (++done % 100 === 0) console.log(`  ${done} baixados`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Download concluído. Falhas: ${failed.length}${failed.length ? ` (${failed.join(", ")})` : ""}.`);
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export async function readCache<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(CACHE_DIR, file), "utf8")) as T;
}
