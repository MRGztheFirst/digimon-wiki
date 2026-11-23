"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO, isLocale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSelect({ onBar = false, className }: { onBar?: boolean; className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    if (!isLocale(next) || next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = LOCALE_INFO[next].htmlLang;
    startTransition(() => router.refresh());
  }

  return (
    <label
      className={cn(
        "btn relative h-9 w-9 gap-1.5 p-0 sm:w-auto sm:px-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
        onBar ? "border-white/25 text-white hover:border-white/60 has-[:focus-visible]:outline-white" : "btn-ghost has-[:focus-visible]:outline-primary",
        pending && "opacity-70",
        className,
      )}
      title={t("Idioma do site")}
    >
      <Languages size={16} aria-hidden="true" />
      <span className="hidden font-mono text-xs font-medium sm:inline" aria-hidden="true">{LOCALE_INFO[locale].short}</span>
      <span className="sr-only">{t("Idioma do site")}</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={LOCALE_INFO[l].htmlLang} className="bg-surface text-fg">
            {LOCALE_INFO[l].label}
          </option>
        ))}
      </select>
    </label>
  );
}
