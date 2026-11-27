import type { Locale } from "./config";
import pt from "./content/attacks.pt.json";
import ja from "./content/attacks.ja.json";

const DICTS: Partial<Record<Locale, Record<string, string>>> = { pt, ja };
const GLOSSED = /^“([^”]*)”(?: — ([\s\S]*))?$/;

export function translateAttack(text: string, locale: Locale): string {
  const dict = DICTS[locale];
  if (!dict) return text;
  const m = text.match(GLOSSED);
  if (!m) return dict[text.trim()] ?? text;
  const gloss = m[1].trim();
  const desc = m[2]?.trim();
  const body = desc ? dict[desc] ?? desc : undefined;
  if (locale === "ja" && body) return body;
  const head = dict[gloss] ?? gloss;
  return body ? `“${head}” — ${body}` : `“${head}”`;
}
