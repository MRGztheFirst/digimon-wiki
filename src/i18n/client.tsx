"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, makeTranslate, type Locale, type Messages, type Translate } from "./config";

type I18nValue = { locale: Locale; t: Translate };

const I18nContext = createContext<I18nValue>({ locale: DEFAULT_LOCALE, t: makeTranslate() });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages?: Messages; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: makeTranslate(messages) }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
