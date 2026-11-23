export const LOCALES = ["pt", "en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";
export const LOCALE_COOKIE = "lang";

export const LOCALE_INFO: Record<Locale, { label: string; short: string; htmlLang: string }> = {
  pt: { label: "Português", short: "PT", htmlLang: "pt-BR" },
  en: { label: "English", short: "EN", htmlLang: "en" },
  ja: { label: "日本語", short: "JA", htmlLang: "ja" },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export type Vars = Record<string, string | number>;
export type Messages = Record<string, string>;
export type Translate = (key: string, vars?: Vars) => string;

export function interpolate(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (Object.hasOwn(vars, k) ? String(vars[k]) : m));
}

export function makeTranslate(...dicts: (Messages | undefined)[]): Translate {
  return (key, vars) => {
    for (const d of dicts) {
      const hit = d && Object.hasOwn(d, key) ? d[key] : undefined;
      if (typeof hit === "string" && hit) return interpolate(hit, vars);
    }
    return interpolate(key, vars);
  };
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.map((r) => r.base).find(isLocale) ?? null;
}
