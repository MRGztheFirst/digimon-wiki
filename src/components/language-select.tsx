"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, LOCALE_INFO, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const STRIPE = 14 / 13;

function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg viewBox="0 0 20 14" aria-hidden="true" className={cn("shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/15", className)}>
      {locale === "pt" && (
        <>
          <rect width="20" height="14" fill="#009c3b" />
          <polygon points="10,1.6 18.4,7 10,12.4 1.6,7" fill="#ffdf00" />
          <circle cx="10" cy="7" r="3.3" fill="#002776" />
          <path d="M6.8 6.4 Q10 5.4 13.2 7.6" stroke="#fff" strokeWidth="0.6" fill="none" />
        </>
      )}
      {locale === "en" && (
        <>
          <rect width="20" height="14" fill="#fff" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={i * 2 * STRIPE} width="20" height={STRIPE} fill="#b22234" />
          ))}
          <rect width="8.5" height={STRIPE * 7} fill="#3c3b6e" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={1.2 + (i % 4) * 2} cy={1.3 + Math.floor(i / 4) * 2.4} r="0.4" fill="#fff" />
          ))}
        </>
      )}
      {locale === "ja" && (
        <>
          <rect width="20" height="14" fill="#fff" />
          <circle cx="10" cy="7" r="4.2" fill="#bc002d" />
        </>
      )}
    </svg>
  );
}

export function LanguageSelect({ onBar = false, className }: { onBar?: boolean; className?: string }) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    items.current[LOCALES.indexOf(locale)]?.focus();
    function away(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, locale]);

  function close(refocus = true) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  function change(next: Locale) {
    close();
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = LOCALE_INFO[next].htmlLang;
    startTransition(() => window.location.reload());
  }

  function onMenuKey(e: React.KeyboardEvent) {
    const list = items.current;
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => list[(i + list.length) % list.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return close(false);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t("Idioma do site")}: ${LOCALE_INFO[locale].label}`}
        title={t("Idioma do site")}
        className={cn(
          "btn h-9 gap-2 px-2.5",
          onBar ? "border-white/25 text-white hover:border-white/60" : "btn-ghost",
          open && (onBar ? "border-white/60" : "border-fg"),
          pending && "opacity-70",
        )}
      >
        <Flag locale={locale} className="h-3.5 w-5" />
        <span className="hidden font-mono text-xs font-medium sm:inline">{LOCALE_INFO[locale].short}</span>
        <ChevronDown size={14} aria-hidden="true" className={cn("-ml-0.5 hidden opacity-70 transition-transform min-[400px]:block motion-reduce:transition-none", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t("Idioma do site")}
          onKeyDown={onMenuKey}
          className="fade-in absolute right-0 top-full z-50 mt-2 w-48 rounded-[8px] border border-line bg-surface p-1 text-fg shadow-xl shadow-black/20"
        >
          <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10.5px] uppercase tracking-wider text-muted" aria-hidden="true">
            {t("Idioma do site")}
          </p>
          {LOCALES.map((l, i) => {
            const current = l === locale;
            return (
              <button
                key={l}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                tabIndex={-1}
                lang={LOCALE_INFO[l].htmlLang}
                onClick={() => change(l)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-surface-2 focus:bg-surface-2",
                  current && "font-medium text-primary",
                )}
              >
                <Flag locale={l} className="h-[15px] w-[22px]" />
                <span className="flex-1">{LOCALE_INFO[l].label}</span>
                {current && <Check size={15} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
