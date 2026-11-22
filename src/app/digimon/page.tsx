import type { Metadata } from "next";
import { db } from "@/lib/db";
import { FILTER_KEYS, searchDigimon, type SearchFilters } from "@/lib/search";
import { Container, PageHeader, Pagination } from "@/components/ui";
import { DigimonGrid } from "@/components/digimon-card";
import { SearchFiltersForm } from "./filters-form";
import { param } from "@/lib/utils";

export const metadata: Metadata = { title: "Enciclopédia — busca avançada" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function DigimonIndex({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters: SearchFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, param(sp[k])?.slice(0, 80)]));
  filters.pagina = Number(param(sp.pagina) ?? 1) || 1;

  const [result, stages, attributes, types, families, groups, media] = await Promise.all([
    searchDigimon(filters),
    db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], select: { slug: true, name: true } }),
    db.attribute.findMany({ select: { slug: true, name: true } }),
    db.digimonType.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.family.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.group.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    db.media.findMany({ orderBy: [{ year: "asc" }], select: { slug: true, name: true, kind: true } }),
  ]);

  const makeHref = (p: number) => {
    const qs = new URLSearchParams();
    FILTER_KEYS.forEach((k) => filters[k] && qs.set(k, String(filters[k])));
    if (p > 1) qs.set("pagina", String(p));
    return `/digimon?${qs}`;
  };
  const active = FILTER_KEYS.filter((k) => k !== "ordem" && filters[k]).length;

  return (
    <div>
      <PageHeader
        crumbs={[[null, "Enciclopédia"]]}
        eyebrow="Enciclopédia"
        title="Todos os Digimon"
        subtitle="Combine filtros livremente — por exemplo, estágio Mega + atributo Virus + tipo Demon Lord."
      />
      <Container className="grid gap-8 py-8 lg:grid-cols-[280px_1fr]">
        <SearchFiltersForm
          values={filters}
          options={{
            estagio: stages.map((s) => [s.slug, s.name]),
            atributo: attributes.map((a) => [a.slug, a.name]),
            tipo: types.map((t) => [t.slug, t.name]),
            familia: families.map((f) => [f.slug, f.name]),
            grupo: groups.map((g) => [g.slug, g.name]),
            jogo: media.filter((m) => m.kind === "game").map((m) => [m.slug, m.name]),
            anime: media.filter((m) => m.kind === "anime" || m.kind === "movie").map((m) => [m.slug, m.name]),
            midia: media.filter((m) => !["game", "anime", "movie"].includes(m.kind)).map((m) => [m.slug, m.name]),
          }}
        />
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <span>
              <b className="text-fg">{result.total}</b> {result.total === 1 ? "Digimon encontrado" : "Digimon encontrados"}
              {active > 0 && ` com ${active} ${active === 1 ? "filtro" : "filtros"}`}
            </span>
            <span>Página {result.page} de {Math.max(1, Math.ceil(result.total / result.pageSize))}</span>
          </div>
          <DigimonGrid items={result.items} empty="Nenhum Digimon corresponde a essa combinação de filtros. Tente remover algum." />
          <Pagination page={result.page} total={result.total} pageSize={result.pageSize} makeHref={makeHref} />
        </div>
      </Container>
    </div>
  );
}
