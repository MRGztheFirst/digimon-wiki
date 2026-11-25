"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, LOCALES, makeTranslate, type Locale, type Messages, type Translate } from "./config";

type I18nValue = { locale: Locale; t: Translate };

const I18nContext = createContext<I18nValue>({ locale: DEFAULT_LOCALE, t: makeTranslate() });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages?: Messages; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeTranslate(messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

export function useSitePathname() {
  const pathname = usePathname();
  return pathname.replace(LOCALE_PREFIX, "") || "/";
}
