"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import {
  ArrowDownUp, ArrowUpFromLine, ArrowUpToLine, BookOpen, ChevronDown, Clapperboard, Filter, Gamepad2,
  Hexagon, Layers, Loader2, Search, Shapes, Tag, Users, X, Zap, type LucideIcon,
} from "lucide-react";
import type { SearchFilters } from "@/lib/search";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { AttributeIcon, FamilyIcon, hasAttributeIcon, hasFamilyIcon } from "@/components/icons";

type Opt = [value: string, label: string, color?: string | null];
type SelectKey = "estagio" | "atributo" | "tipo" | "familia" | "grupo" | "jogo" | "anime" | "midia";
type Options = Record<SelectKey, Opt[]>;
type OnPick = (name: string, value: string) => void;

const GROUPS: [title: string, fields: [SelectKey, string, LucideIcon][]][] = [
  ["Classificação", [
    ["estagio", "Estágio", Layers],
    ["atributo", "Atributo", Hexagon],
    ["tipo", "Tipo", Tag],
    ["familia", "Família", Shapes],
    ["grupo", "Grupo / organização", Users],
  ]],
  ["Aparições", [
    ["jogo", "Jogo", Gamepad2],
    ["anime", "Anime / filme", Clapperboard],
    ["midia", "Outras mídias", BookOpen],
  ]],
];

const SORTS: [string, string][] = [
  ["", "Número da wiki"],
  ["nome", "Nome (A–Z)"],
  ["estagio", "Estágio"],
  ["populares", "Mais vistos"],
  ["recentes", "Adicionados recentemente"],
];

export function SearchFiltersForm({ values, options }: { values: SearchFilters; options: Options }) {
  const { t } = useI18n();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const active = (Object.keys(values) as (keyof SearchFilters)[]).filter((k) => k !== "ordem" && k !== "pagina" && values[k]).length;

  function apply(patch: Record<string, string> = {}) {
    const fd = new FormData(formRef.current!);
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v.trim()) qs.set(k, v.trim());
    for (const [k, v] of Object.entries(patch)) if (v) qs.set(k, v); else qs.delete(k);
    start(() => router.push(`/digimon${qs.size ? `?${qs}` : ""}`));
  }
  const pick: OnPick = (name, value) => apply({ [name]: value });

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="card scroll-slim flex h-fit flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      key={JSON.stringify(values)}
      aria-busy={pending}
    >
      <div
        className="relative shrink-0 overflow-hidden border-b border-line p-4"
        style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--primary) 24%, var(--surface)), color-mix(in oklab, var(--primary) 5%, var(--surface)) 72%)" }}
      >
        <span aria-hidden="true" className="absolute inset-0 text-primary opacity-[0.12] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px]" />
        <span aria-hidden="true" className="absolute -right-6 -top-7 rotate-12 text-primary opacity-[0.14]">
          <Filter size={116} strokeWidth={1.5} />
        </span>
        <div className="relative mb-3.5 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-primary text-primary-fg shadow-[0_6px_16px_-6px_var(--primary)]">
              <Filter size={16} />
            </span>
            {t("Filtros")}
            {active > 0 && (
              <span className="pop-in grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-semibold tabular-nums text-primary-fg">{active}</span>
            )}
          </h2>
          {pending && <Loader2 size={18} className="animate-spin text-primary" aria-label={t("Carregando…")} />}
        </div>
        <label className="relative block">
          <span className="sr-only">{t("Nome")}</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="q"
            type="search"
            defaultValue={values.q ?? ""}
            placeholder="Agumon, アグモン..."
            autoComplete="off"
            className="field h-11 bg-surface pl-9 pr-3 pt-0 pb-0"
          />
        </label>
      </div>

      <div className="flex-1 space-y-6 p-4">
        {GROUPS.map(([title, fields]) => (
          <Group key={title} title={t(title)}>
            {fields.map(([k, label, Icon]) => (
              <SelectField key={k} name={k} label={t(label)} icon={Icon} options={options[k]} defaultValue={values[k]} allLabel={t("Todos")} clearLabel={t("Limpar seleção")} onPick={pick} />
            ))}
          </Group>
        ))}

        <Group title={t("Evolução")}>
          <TextField name="de" label={t("Evolui a partir de")} icon={ArrowUpFromLine} placeholder={t("ex.: {x}", { x: "Agumon" })} defaultValue={values.de} />
          <TextField name="para" label={t("Pode evoluir para")} icon={ArrowUpToLine} placeholder={t("ex.: {x}", { x: "Omnimon" })} defaultValue={values.para} />
        </Group>

        <Group title={t("Golpes e habilidades")}>
          <TextField name="habilidade" label={t("Habilidade ou golpe")} icon={Zap} placeholder={t("ex.: {x}", { x: "Flame, Laser" })} defaultValue={values.habilidade} />
        </Group>

        <fieldset>
          <legend className="mb-2.5 flex w-full items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            <ArrowDownUp size={12} aria-hidden="true" />
            {t("Ordenar por")}
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map(([v, l]) => (
              <label key={v} className="cursor-pointer">
                <input type="radio" name="ordem" value={v} defaultChecked={(values.ordem ?? "") === v} onChange={() => apply()} className="peer sr-only" />
                <span className="inline-flex h-8 items-center rounded-full border border-line bg-bg px-3 text-[13px] font-medium text-muted transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-primary/60 hover:text-fg peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg peer-checked:shadow-[0_6px_16px_-8px_var(--primary)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                  {t(l)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 flex shrink-0 gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur">
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Search size={15} aria-hidden="true" />}
          {t("Aplicar")}
        </button>
        <button
          type="button"
          onClick={() => start(() => router.push("/digimon"))}
          disabled={active === 0 || pending}
          className="btn btn-ghost group flex-1 hover:border-primary/70 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:text-fg"
        >
          <X size={15} aria-hidden="true" className="text-muted transition-[color,transform] duration-200 group-hover:rotate-90 group-hover:text-primary group-disabled:rotate-0 group-disabled:text-muted motion-reduce:transition-none" />
          {t("Limpar filtros")}
        </button>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <div id={id} className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{children}</div>
    </div>
  );
}

function SelectField({
  name, label, icon: Icon, options, defaultValue, allLabel, clearLabel, onPick,
}: {
  name: SelectKey; label: string; icon: LucideIcon; options: Opt[]; defaultValue?: string; allLabel: string; clearLabel: string; onPick: OnPick;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const on = value !== "";
  const color = options.find(([v]) => v === value)?.[2];
  const img =
    on && name === "atributo" && hasAttributeIcon(value) ? <AttributeIcon slug={value} size={22} name="" /> :
    on && name === "familia" && hasFamilyIcon(value) ? <FamilyIcon slug={value} size={22} name="" /> :
    null;

  return (
    <div className="group relative" style={{ ["--c" as string]: color ?? "var(--primary)" }}>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] transition-[background-color,color,transform] duration-200 motion-reduce:transition-none",
          on
            ? "bg-[color-mix(in_oklab,var(--c)_22%,var(--surface))] text-[color-mix(in_oklab,var(--c)_70%,var(--fg))]"
            : "bg-surface-2 text-muted group-hover:-rotate-6 group-hover:text-primary",
        )}
      >
        {img ?? <Icon size={16} />}
      </span>
      <label htmlFor={id} className="pointer-events-none absolute left-12 top-[7px] text-[11px] font-medium leading-none text-muted">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onPick(name, e.target.value);
        }}
        className={cn("field pl-12 pr-9", on && "field-on")}
      >
        <option value="">{allLabel}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {on ? (
        <button
          type="button"
          aria-label={`${clearLabel}: ${label}`}
          title={clearLabel}
          onClick={() => {
            setValue("");
            onPick(name, "");
          }}
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[5px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={14} />
        </button>
      ) : (
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-transform duration-200 group-hover:translate-y-[-35%] motion-reduce:transition-none" />
      )}
      {on && <span aria-hidden="true" className="grow-x pointer-events-none absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[var(--c)]" />}
    </div>
  );
}

function TextField({ name, label, icon: Icon, placeholder, defaultValue }: { name: string; label: string; icon: LucideIcon; placeholder?: string; defaultValue?: string }) {
  const id = useId();
  const on = !!defaultValue;
  return (
    <div className="group relative">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] transition-[background-color,color,transform] duration-200 motion-reduce:transition-none",
          on ? "bg-[color-mix(in_oklab,var(--primary)_22%,var(--surface))] text-primary" : "bg-surface-2 text-muted group-hover:-rotate-6 group-hover:text-primary group-focus-within:text-primary",
        )}
      >
        <Icon size={16} />
      </span>
      <label htmlFor={id} className="pointer-events-none absolute left-12 top-[7px] text-[11px] font-medium leading-none text-muted">
        {label}
      </label>
      <input id={id} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} autoComplete="off" className={cn("field pl-12 pr-3", on && "field-on")} />
    </div>
  );
}
