import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader, Section } from "@/components/ui";
import { EvolutionKindGlyph } from "@/components/evolution-kind-glyph";
import { EVOLUTION_KINDS, EVOLUTION_KIND_KEYS, REVIEW_STATUSES, SOURCE_KINDS, STATUSES, STATUS_KEYS, type SourceKind } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getI18n, localeFromParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  await localeFromParams(params);
  const { t } = await getI18n();
  return { title: t("Fontes e confiabilidade") };
}

const MEDIA_SOURCE_PREFIX = "Wikimon — ";
const OWN_SOURCES = ["Wikimon — evoluções por obra"];
const KIND_PRIORITY = Object.keys(SOURCE_KINDS);

const LINE: Record<string, { dash?: string; label: string }> = {
  official: { label: "Linha contínua" },
  media: { label: "Linha contínua" },
  community: { dash: "2 4", label: "Linha pontilhada" },
  unconfirmed: { dash: "6 4", label: "Linha tracejada" },
};

function TableHead({ cols, className }: { cols: string[]; className: string }) {
  return (
    <div className={cn("hidden gap-4 border-b border-line bg-surface-2/60 px-4 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted sm:grid", className)}>
      {cols.map((c, i) => (
        <span key={c} className={i > 1 ? "text-right" : undefined}>{c}</span>
      ))}
    </div>
  );
}

function Marker({ color }: { color: string }) {
  return <span className="h-3.5 w-1 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />;
}

export default async function SourcesPage({ params }: { params: Promise<{ lang: string }> }) {
  await localeFromParams(params);
  const { t, td, num } = await getI18n();
  const usage = { _count: { select: { citations: true, evolutions: true, evolutionContexts: true, appearances: true } } } as const;
  const [sources, own, mediaSources, review] = await Promise.all([
    db.source.findMany({ where: { NOT: { title: { startsWith: MEDIA_SOURCE_PREFIX } } }, include: usage, orderBy: { id: "asc" } }),
    db.source.findMany({ where: { title: { in: OWN_SOURCES } }, include: usage }),
    db.source.count({ where: { title: { startsWith: MEDIA_SOURCE_PREFIX, notIn: OWN_SOURCES } } }),
    db.digimon.groupBy({ by: ["reviewStatus"], _count: { _all: true } }),
  ]);
  const extra = (s: (typeof sources)[number], k: keyof (typeof sources)[number]["_count"]) =>
    s.kind === "wikimon" && s.title === "Wikimon" ? own.reduce((sum, o) => sum + o._count[k], 0) : 0;
  const count = (s: (typeof sources)[number], k: keyof (typeof sources)[number]["_count"]) => s._count[k] + extra(s, k);
  const ranked = [...sources].sort((a, b) => KIND_PRIORITY.indexOf(a.kind) - KIND_PRIORITY.indexOf(b.kind) || a.id - b.id);
  const reviewCount = (k: string) => review.find((r) => r.reviewStatus === k)?._count._all ?? 0;
  const term = (s: string) => t(s).replace(/[:：]\s*$/, "");

  const toc: [string, string][] = [
    ["confiabilidade", t("Níveis de confiabilidade")],
    ["revisao", t("Revisão dos registros")],
    ["tipos", t("Linhas da árvore evolutiva")],
    ["fontes", t("Fontes cadastradas")],
  ];

  const rules: [string, string][] = [
    [term("Informação de mídia:"), t("“Específica da mídia” é sempre acompanhada da obra (jogo, anime, filme, mangá, V-Pet ou card game) em que vale. Regras de um jogo nunca são apresentadas como universais.")],
    [term("Comunidade:"), t("linhas evolutivas criadas por fãs ficam ocultas por padrão nas árvores e são exibidas com linha pontilhada quando ativadas.")],
    [term("Campos vazios:"), t("quando não há fonte confiável, o campo aparece como “Não documentado”.")],
  ];

  return (
    <div>
      <PageHeader crumbs={[[null, t("Fontes e confiabilidade")]]} eyebrow={t("Regra fundamental")} title={t("Fontes e confiabilidade")}
        subtitle={t("Esta wiki não inventa informações para preencher páginas. Cada dado indica de onde vem e em que contexto vale.")} />
      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label={t("Nesta página")} className="hidden lg:block">
            <div className="sticky top-24">
              <div className="label mb-3">{t("Nesta página")}</div>
              <ul className="space-y-1 border-l border-line text-sm">
                {toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-muted transition-colors hover:border-primary hover:text-fg">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-14">
            <Section id="confiabilidade" title={t("Níveis de confiabilidade")}>
              <div className="overflow-hidden rounded-[8px] border border-line">
                <TableHead cols={[t("Nível"), t("Significado"), t("Na árvore")]} className="grid-cols-[170px_minmax(0,1fr)_150px]" />
                {STATUS_KEYS.map((k) => {
                  const s = STATUSES[k];
                  return (
                    <div key={k} className="grid gap-1.5 border-b border-line bg-surface px-4 py-3.5 last:border-0 sm:grid-cols-[170px_minmax(0,1fr)_150px] sm:items-center sm:gap-4">
                      <span className="flex items-center gap-2.5 text-sm font-semibold"><Marker color={s.color} />{t(s.label)}</span>
                      <span className="text-sm text-muted">{t(s.long)}</span>
                      <span className="flex items-center gap-2 text-xs text-muted sm:justify-end">
                        <svg width="32" height="6" aria-hidden="true" className="shrink-0"><line x1="0" y1="3" x2="32" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray={LINE[k].dash} /></svg>
                        {t(LINE[k].label)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <h3 className="mb-1 mt-8 text-sm font-semibold">{t("Regras de exibição")}</h3>
              <dl className="divide-y divide-line border-y border-line">
                {rules.map(([dt, dd]) => (
                  <div key={dt} className="grid gap-1 py-3 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
                    <dt className="text-sm font-medium">{dt}</dt>
                    <dd className="text-sm text-muted first-letter:uppercase">{dd}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section id="revisao" title={t("Revisão dos registros")}>
              <div className="overflow-hidden rounded-[8px] border border-line">
                <TableHead cols={[t("Status"), t("Significado"), "Digimon"]} className="grid-cols-[170px_minmax(0,1fr)_100px]" />
                {Object.entries(REVIEW_STATUSES).map(([k, s]) => {
                  const n = reviewCount(k);
                  return (
                    <div key={k} className="grid gap-1.5 border-b border-line bg-surface px-4 py-3.5 last:border-0 sm:grid-cols-[170px_minmax(0,1fr)_100px] sm:items-center sm:gap-4">
                      <span className="flex items-center gap-2.5 text-sm font-semibold"><Marker color={s.color} />{t(s.label)}</span>
                      <span className="text-sm text-muted">{t(s.long)}</span>
                      <span className={cn("font-mono text-sm tabular-nums sm:text-right", n ? "text-fg" : "text-muted")}>{num(n)}</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section id="tipos" title={t("Linhas da árvore evolutiva")} description={t("Cada conexão da árvore tem um tipo. As especiais aparecem destacadas e coloridas.")}>
              <div className="grid gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-2">
                {EVOLUTION_KIND_KEYS.map((k) => {
                  const v = EVOLUTION_KINDS[k];
                  return (
                    <div key={k} className={cn("group flex items-start gap-3 bg-surface px-4 py-3", k === "normal" && "sm:col-span-2")}>
                      <EvolutionKindGlyph kind={k} color={v.color} className="mt-0.5 h-6 w-10 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{t(v.label)}</span>
                        <span className="block text-xs text-muted">{t(v.description)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section id="fontes" title={t("Fontes cadastradas")} description={t("Prioridade: Digimon Reference Book e materiais oficiais, depois Wikimon. Além destas, há {n} fontes específicas por obra.", { n: mediaSources })}>
              <div className="overflow-hidden rounded-[8px] border border-line">
                <div className="hidden grid-cols-[28px_minmax(0,1fr)_170px] gap-4 border-b border-line bg-surface-2/60 px-4 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted sm:grid">
                  <span>#</span>
                  <span>{t("Fonte")}</span>
                  <span className="text-right">{t("Uso no banco")}</span>
                </div>
                {ranked.map((s, i) => {
                  const totals = [count(s, "citations"), count(s, "evolutions"), count(s, "evolutionContexts") + count(s, "appearances")];
                  const used = [
                    t("{n} citações", { n: num(totals[0]) }),
                    t("{n} evoluções", { n: num(totals[1]) }),
                    t("{n} contextos", { n: num(totals[2]) }),
                  ].filter((_, j) => totals[j] > 0);
                  const meta = [...new Set([t(SOURCE_KINDS[s.kind as SourceKind] ?? s.kind), s.publisher && t(s.publisher)])].filter(Boolean).join(" · ");
                  return (
                    <div key={s.id} className="grid gap-2 border-b border-line bg-surface px-4 py-4 last:border-0 sm:grid-cols-[28px_minmax(0,1fr)_170px] sm:gap-4">
                      <span className="hidden pt-0.5 font-mono text-xs text-muted sm:block">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-1 font-semibold leading-tight hover:text-primary">
                            {s.title}
                            <ArrowUpRight size={14} aria-hidden="true" className="text-muted transition-colors group-hover/link:text-primary" />
                          </a>
                        ) : (
                          <span className="font-semibold leading-tight">{s.title}</span>
                        )}
                        <div className="mt-0.5 text-xs text-muted">{meta}</div>
                        {s.notes && <p className="mt-1.5 max-w-xl text-sm text-muted">{td(s.notes)}</p>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs tabular-nums sm:block sm:space-y-1 sm:pt-0.5 sm:text-right">
                        {used.length ? used.map((u) => <div key={u}>{u}</div>) : <div className="text-muted">{t("Ainda sem uso")}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        </div>
      </Container>
    </div>
  );
}
