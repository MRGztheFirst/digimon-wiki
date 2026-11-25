import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, makeTranslate, type Locale, type Messages } from "./config";
import { uiMessages } from "./messages";
import contentEn from "./content/en.json";
import contentJa from "./content/ja.json";

const contentMessages: Record<Locale, Messages | undefined> = { pt: undefined, en: contentEn, ja: contentJa };

const requestLocale = cache((): { current: Locale | null } => ({ current: null }));

export function setRequestLocale(value: string) {
  if (isLocale(value)) requestLocale().current = value;
}

export async function localeFromParams(params: Promise<{ lang: string }>) {
  const { lang } = await params;
  setRequestLocale(isLocale(lang) ? lang : DEFAULT_LOCALE);
  return lang;
}

export const getLocale = cache(async (): Promise<Locale> => {
  const fixed = requestLocale().current;
  if (fixed) return fixed;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return localeFromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
});

type Named = { name: string; nameJp?: string | null };

export const getI18n = cache(async () => {
  const locale = await getLocale();
  const t = makeTranslate(uiMessages[locale], contentMessages[locale]);
  const td = <T extends string | null | undefined>(v: T): T => (v ? (t(v) as T) : v);
  const ln = (e: Named) => (locale === "ja" && e.nameJp ? e.nameJp : t(e.name));
  const num = (n: number) => n.toLocaleString(locale === "pt" ? "pt-BR" : locale);
  return { locale, t, td, ln, num };
});
