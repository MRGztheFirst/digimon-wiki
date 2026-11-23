"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { DigimonAvatar } from "./digimon-avatar";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/client";

export type SearchResult = {
  id: number;
  slug: string;
  name: string;
  nameJp: string | null;
  number: number;
  imageUrl: string | null;
  stage: { name: string; color: string } | null;
  attribute: { name: string; color: string } | null;
};

export function useDigimonSearch(q: string, locale?: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => setResults(j.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, locale]);
  return { results, loading };
}

type Props = {
  compact?: boolean;
  placeholder?: string;
  onPick?: (r: SearchResult) => void;
  autoFocus?: boolean;
  className?: string;
};

export function SearchBox({ compact, placeholder, onPick, autoFocus, className }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { results, loading } = useDigimonSearch(q, locale);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => setActive(0), [results]);

  function pick(r: SearchResult) {
    setOpen(false);
    if (onPick) {
      onPick(r);
      setQ("");
    } else router.push(`/digimon/${r.slug}`);
  }
  function submit() {
    if (results[active] && open) return pick(results[active]);
    if (!onPick && q.trim()) router.push(`/digimon?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", compact ? "left-3" : "left-4")} size={compact ? 15 : 19} />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder ?? (compact ? t("Buscar Digimon...") : t("Buscar por nome: Agumon, オメガモン, Tailmon..."))}
          className={cn(
            "w-full border border-line bg-surface text-fg transition-colors placeholder:text-muted/80 focus:border-primary focus:outline-none",
            compact ? "h-9 rounded-[6px] border-transparent pl-9 pr-3 text-sm" : "h-14 rounded-[8px] pl-12 pr-4 text-base shadow-sm sm:text-[17px]",
          )}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t("Buscar Digimon")}
        />
      </div>
      {open && q.trim() && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[8px] border border-line bg-surface shadow-xl shadow-black/20">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">{loading ? t("Buscando...") : onPick ? t("Nenhum resultado.") : t("Nenhum resultado. Pressione Enter para a busca avançada.")}</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={cn("flex w-full items-center gap-3 px-3 py-2 text-left", i === active && "bg-surface-2")}
              >
                <DigimonAvatar name={r.name} imageUrl={r.imageUrl} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[15px] font-semibold">{r.name}</div>
                  <div className="truncate text-[13px] text-muted">
                    {[r.nameJp, r.stage?.name, r.attribute?.name?.split(" (")[0]].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </button>
            ))
          )}
          {!onPick && (
            <button type="button" onClick={() => router.push(`/digimon?q=${encodeURIComponent(q.trim())}`)} className="w-full border-t border-line px-3 py-2 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-primary">
              {t("Ver todos os resultados na busca avançada")} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
