"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Filter, Loader2, X } from "lucide-react";
import type { SearchFilters } from "@/lib/search";

type Opt = [value: string, label: string];
type Options = Record<"estagio" | "atributo" | "tipo" | "familia" | "grupo" | "jogo" | "anime" | "midia", Opt[]>;

const SELECTS: [keyof Options, string][] = [
  ["estagio", "Estágio"],
  ["atributo", "Atributo"],
  ["tipo", "Tipo"],
  ["familia", "Família"],
  ["grupo", "Grupo / organização"],
  ["jogo", "Jogo"],
  ["anime", "Anime / filme"],
  ["midia", "Outras mídias"],
];

export function SearchFiltersForm({ values, options }: { values: SearchFilters; options: Options }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  function apply() {
    const fd = new FormData(formRef.current!);
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v.trim()) qs.set(k, v.trim());
    start(() => router.push(`/digimon${qs.size ? `?${qs}` : ""}`));
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="card h-fit space-y-4 p-4 lg:sticky lg:top-20"
      key={JSON.stringify(values)}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Filter size={16} className="text-primary" /> Filtros
        </h2>
        {pending && <Loader2 size={16} className="animate-spin text-muted" />}
      </div>
      <Text name="q" label="Nome" placeholder="Agumon, アグモン..." defaultValue={values.q} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {SELECTS.map(([k, label]) => (
          <label key={k} className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
            <select name={k} defaultValue={values[k] ?? ""} className="input" onChange={apply}>
              <option value="">Todos</option>
              {options[k].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <Text name="habilidade" label="Habilidade ou golpe" placeholder="ex.: Flame, Laser" defaultValue={values.habilidade} />
      <Text name="de" label="Evolui a partir de" placeholder="ex.: Agumon" defaultValue={values.de} />
      <Text name="para" label="Pode evoluir para" placeholder="ex.: Omnimon" defaultValue={values.para} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Ordenar por</span>
        <select name="ordem" defaultValue={values.ordem ?? ""} className="input" onChange={apply}>
          <option value="">Número da wiki</option>
          <option value="nome">Nome (A–Z)</option>
          <option value="estagio">Estágio</option>
          <option value="populares">Mais vistos</option>
          <option value="recentes">Adicionados recentemente</option>
        </select>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary flex-1">Aplicar</button>
        <button type="button" className="btn btn-ghost" onClick={() => start(() => router.push("/digimon"))} title="Limpar filtros">
          <X size={16} />
        </button>
      </div>
    </form>
  );
}

function Text({ name, label, placeholder, defaultValue }: { name: string; label: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="input" />
    </label>
  );
}
