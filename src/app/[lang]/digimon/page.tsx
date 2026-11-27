import type { Metadata } from "next";
import { db } from "@/lib/db";
import { FILTER_KEYS, searchDigimon, type SearchFilters } from "@/lib/search";
import { Container, PageHeader, Pagination } from "@/components/ui";
import { DigimonGrid } from "@/components/digimon-card";
import { SearchFiltersForm } from "./filters-form";
import { param } from "@/lib/utils";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t("Enciclopédia — busca avançada") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function DigimonIndex({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }) {
  await localeFromParams(params);
  const sp = await searchParams;
  const { t, ln } = await getI18n();
  const filters: SearchFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, param(sp[k])?.slice(0, 80)]));
  filters.pagina = Number(param(sp.pagina) ?? 1) || 1;

  const [result, stages, attributes, types, families, groups, media, years] = await Promise.all([
    searchDigimon(filters),
    db.stage.findMany({ orderBy: [{ order: "asc" }, { isSpecial: "asc" }], select: { slug: true, name: true, nameJp: true, color: true } }),
    db.attribute.findMany({ select: { slug: true, name: true, nameJp: true, color: true } }),
    db.digimonType.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, nameJp: true } }),
    db.family.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, nameJp: true, color: true } }),
    db.group.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, nameJp: true } }),
    db.media.findMany({ orderBy: [{ year: "asc" }], select: { slug: true, name: true, nameJp: true, kind: true, color: true } }),
    db.digimon.groupBy({ by: ["drbYear"], where: { drbYear: { not: null } }, orderBy: { drbYear: "desc" } }),
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
        crumbs={[[null, t("Enciclopédia")]]}
        eyebrow={t("Enciclopédia")}
        title={t("Todos os Digimon")}
        subtitle={t("Combine filtros livremente — por exemplo, estágio Mega + atributo Virus + tipo Demon Lord.")}
      />
      <Container className="grid gap-8 py-8 lg:grid-cols-[280px_1fr]">
        <SearchFiltersForm
          values={filters}
          options={{
            estagio: stages.map((s) => [s.slug, ln(s), s.color]),
            atributo: attributes.map((a) => [a.slug, ln(a), a.color]),
            tipo: types.map((ty) => [ty.slug, ln(ty)]),
            familia: families.map((f) => [f.slug, ln(f), f.color]),
            grupo: groups.map((g) => [g.slug, ln(g)]),
            ano: years.map((y) => [String(y.drbYear), String(y.drbYear)]),
            jogo: media.filter((m) => m.kind === "game").map((m) => [m.slug, ln(m), m.color]),
            anime: media.filter((m) => m.kind === "anime" || m.kind === "movie").map((m) => [m.slug, ln(m), m.color]),
            midia: media.filter((m) => !["game", "anime", "movie"].includes(m.kind)).map((m) => [m.slug, ln(m), m.color]),
          }}
        />
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between text-sm text-muted">
            <span>
              <b className="text-fg">{result.total}</b> {result.total === 1 ? t("Digimon encontrado") : t("Digimon encontrados")}
              {active > 0 && (active === 1 ? t(" com 1 filtro") : t(" com {n} filtros", { n: active }))}
            </span>
            <span>{t("Página {page} de {pages}", { page: result.page, pages: Math.max(1, Math.ceil(result.total / result.pageSize)) })}</span>
          </div>
          <DigimonGrid items={result.items} empty={t("Nenhum Digimon corresponde a essa combinação de filtros. Tente remover algum.")} />
          <Pagination page={result.page} total={result.total} pageSize={result.pageSize} makeHref={makeHref} />
        </div>
      </Container>
    </div>
  );
}
