"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronDown, Clapperboard, Egg, Gamepad2, Layers, Library, Search, Sparkles, Tv } from "lucide-react";
import { MEDIA_KINDS, mediaKindOf, type MediaKind } from "@/lib/constants";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type MediaChoice = { slug: string; name: string; kind: string; count: number; main: boolean };

const ORDER: MediaKind[] = ["game", "anime", "movie", "vpet", "card", "manga", "other"];
const ICONS = { anime: Tv, movie: Clapperboard, manga: BookOpen, game: Gamepad2, vpet: Egg, card: Layers, other: Sparkles };

type Row = { slug: string | null; name: string; count: number | null; kind: MediaKind | null };

export function MediaPicker({ choices, current, onPick }: { choices: MediaChoice[]; current: string | null; onPick: (slug: string | null) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = choices.find((c) => c.slug === current) ?? null;
  const SelectedIcon = selected ? ICONS[mediaKindOf(selected.kind)] : Library;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = choices.filter((c) => !q || c.name.toLowerCase().includes(q));
    return ORDER.map((k) => ({
      kind: k,
      items: hits
        .filter((c) => mediaKindOf(c.kind) === k)
        .sort((a, b) => Number(b.main) - Number(a.main) || b.count - a.count || a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length);
  }, [choices, query]);

  const rows = useMemo<Row[]>(() => {
    const all: Row[] = query.trim() ? [] : [{ slug: null, name: t("Todas as obras"), count: null, kind: null }];
    groups.forEach((g) => g.items.forEach((c) => all.push({ slug: c.slug, name: c.name, count: c.count, kind: g.kind })));
    return all;
  }, [groups, query, t]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const at = rows.findIndex((r) => r.slug === current);
    setActive(at < 0 ? 0 : at);
    function away(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    list.current?.querySelector(`[data-row="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function close() {
    setOpen(false);
    setQuery("");
    button.current?.focus();
  }

  function pick(r: Row) {
    close();
    if (r.slug !== current) onPick(r.slug);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") setActive((a) => Math.min(rows.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(rows.length - 1);
    else if (e.key === "Enter" && rows[active]) pick(rows[active]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return setOpen(false);
    else return;
    e.preventDefault();
  }

  let index = -1;
  const option = (r: Row) => {
    index++;
    const i = index;
    const on = r.slug === current;
    return (
      <div
        key={r.slug ?? "all"}
        id={`${listId}-${i}`}
        data-row={i}
        role="option"
        aria-selected={on}
        onPointerMove={() => setActive(i)}
        onClick={() => pick(r)}
        className={cn("flex cursor-pointer items-center gap-3 rounded-[6px] px-2.5 py-1.5 text-sm", i === active && "bg-surface-2", on && "font-medium text-primary")}
      >
        <span className="min-w-0 flex-1 truncate">{r.name}</span>
        {r.count != null && <span className="shrink-0 font-mono text-[11px] text-muted">{r.count}</span>}
        <Check size={14} aria-hidden="true" className={cn("shrink-0", on ? "opacity-100" : "opacity-0")} />
      </div>
    );
  };

  return (
    <div ref={root} className="relative w-full max-w-md">
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
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn("btn btn-ghost h-10 w-full justify-start gap-2.5 px-3 text-left", open && "border-fg")}
      >
        <SelectedIcon size={16} aria-hidden="true" className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium">{selected ? selected.name : t("Todas as obras")}</span>
        {selected && <span className="shrink-0 rounded-[3px] bg-surface-2 px-1.5 py-0.5 text-[10.5px] text-muted">{t(MEDIA_KINDS[mediaKindOf(selected.kind)].label)}</span>}
        <ChevronDown size={15} aria-hidden="true" className={cn("shrink-0 opacity-70 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fade-in absolute left-0 top-full z-50 mt-2 w-full min-w-72 rounded-[8px] border border-line bg-surface text-fg shadow-xl shadow-black/20">
          <div className="relative border-b border-line p-2">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
              aria-label={t("Buscar obra")}
              placeholder={t("Buscar obra...")}
              autoComplete="off"
              spellCheck={false}
              className="input h-9 pl-8 text-sm"
            />
          </div>
          <div ref={list} id={listId} role="listbox" aria-label={t("Ver a árvore de")} className="scrollbar-thin max-h-80 overflow-y-auto p-1">
            {!query.trim() && option(rows[0])}
            {groups.map((g) => {
              const Icon = ICONS[g.kind];
              return (
                <div key={g.kind} role="group" aria-label={t(MEDIA_KINDS[g.kind].plural)}>
                  <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-2.5 font-mono text-[10.5px] uppercase tracking-wider text-muted" aria-hidden="true">
                    <Icon size={12} />
                    {t(MEDIA_KINDS[g.kind].plural)}
                  </div>
                  {g.items.map((c) => option({ slug: c.slug, name: c.name, count: c.count, kind: g.kind }))}
                </div>
              );
            })}
            {!rows.length && <p className="px-2.5 py-6 text-center text-sm text-muted">{t("Nenhuma obra encontrada.")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
