"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { DigimonAvatar } from "./digimon-avatar";

export type TypeEntry = { slug: string; name: string; subtitle?: string | null; description?: string | null; count: number; face: { name: string; imageUrl: string | null } | null };

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function letterOf(name: string) {
  const c = name.normalize("NFD")[0]?.toUpperCase() ?? "#";
  return LETTERS.includes(c) ? c : "#";
}

export function TypeIndex({ items }: { items: TypeEntry[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const max = Math.max(1, ...items.map((i) => i.count));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = items.filter((i) => !q || i.name.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q));
    const map = new Map<string, TypeEntry[]>();
    for (const i of hits) map.set(letterOf(i.name), [...(map.get(letterOf(i.name)) ?? []), i]);
    return [...map.entries()].sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  }, [items, query]);

  const present = new Set(groups.map(([l]) => l));
  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Buscar tipo...")}
            aria-label={t("Buscar tipo")}
            autoComplete="off"
            spellCheck={false}
            className="input h-10 pl-9 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={t("Limpar busca")} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[4px] text-muted hover:bg-surface-2 hover:text-fg">
              <X size={14} />
            </button>
          )}
        </div>
        <nav aria-label={t("Ir para a letra")} className="flex flex-wrap gap-0.5 font-mono text-[13px]">
          {LETTERS.map((l) =>
            present.has(l) ? (
              <a key={l} href={`#letra-${l}`} className="flex h-7 w-7 items-center justify-center rounded-[4px] text-fg/85 transition-colors hover:bg-primary hover:text-primary-fg">
                {l}
              </a>
            ) : (
              <span key={l} className="flex h-7 w-7 items-center justify-center text-muted/40" aria-hidden="true">{l}</span>
            ),
          )}
        </nav>
      </div>

      <p className="sr-only" aria-live="polite">{t("{n} tipos", { n: total })}</p>

      {groups.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">{t("Nenhum tipo encontrado.")}</p>
      ) : (
        <div className="space-y-8">
          {groups.map(([letter, list]) => (
            <section key={letter} id={`letra-${letter}`} className="grid scroll-mt-24 gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-[56px_minmax(0,1fr)]">
              <h3 className="font-display text-3xl font-semibold leading-none text-primary sm:sticky sm:top-20 sm:self-start">{letter}</h3>
              <ul className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((i) => (
                  <li key={i.slug}>
                    <Link href={`/tipos/${i.slug}`} title={i.description ?? undefined} className="group flex items-center gap-3 py-2">
                      {i.face ? (
                        <DigimonAvatar name={i.face.name} imageUrl={i.face.imageUrl} className="h-11 w-11 shrink-0 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-110 motion-reduce:transition-none motion-reduce:transform-none" />
                      ) : (
                        <span className="h-11 w-11 shrink-0 rounded-[4px] border border-dashed border-line" aria-hidden="true" />
                      )}
                      <span className="block min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate font-medium transition-colors group-hover:text-primary">{i.name}</span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{i.count}</span>
                      </span>
                      <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-surface-2">
                        <span
                          className={cn("block h-full rounded-full transition-colors", i.count ? "bg-primary/45 group-hover:bg-primary" : "bg-transparent")}
                          style={{ width: `${Math.max(i.count ? 3 : 0, Math.sqrt(i.count / max) * 100)}%` }}
                        />
                      </span>
                      {i.subtitle && <span className="mt-1 block truncate text-[11px] text-muted">{i.subtitle}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
