import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Container, PageHeader, Section } from "@/components/ui";
import { Pill } from "@/components/badges";
import { EVOLUTION_KINDS, REVIEW_STATUSES, SOURCE_KINDS, STATUSES, type SourceKind } from "@/lib/constants";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("Fontes e confiabilidade") };
}

export default async function SourcesPage() {
  const { t, td } = await getI18n();
  const sources = await db.source.findMany({
    where: { NOT: { title: { startsWith: "Wikimon — " } } },
    include: { _count: { select: { citations: true, evolutions: true, evolutionContexts: true, appearances: true } } },
    orderBy: { id: "asc" },
  });
  const mediaSources = await db.source.count({ where: { title: { startsWith: "Wikimon — " } } });

  return (
    <div>
      <PageHeader crumbs={[[null, t("Fontes e confiabilidade")]]} eyebrow={t("Regra fundamental")} title={t("Fontes e confiabilidade")}
        subtitle={t("Esta wiki não inventa informações para preencher páginas. Cada dado indica de onde vem e em que contexto vale.")} />
      <Container className="space-y-12 py-10">
        <Section title={t("Níveis de confiabilidade")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(STATUSES).map(([k, s]) => (
              <div key={k} className="card p-4" style={{ borderTop: `3px solid ${s.color}` }}>
                <Pill color={s.color}>{t(s.label)}</Pill>
                <p className="mt-2 text-sm text-muted">{t(s.long)}</p>
              </div>
            ))}
          </div>
          <div className="card mt-4 space-y-2 p-5 text-sm text-muted">
            <p><b className="text-fg">{t("Informação de mídia:")}</b> {t("“Específica da mídia” é sempre acompanhada da obra (jogo, anime, filme, mangá, V-Pet ou card game) em que vale. Regras de um jogo nunca são apresentadas como universais.")}</p>
            <p><b className="text-fg">{t("Comunidade:")}</b> {t("linhas evolutivas criadas por fãs ficam ocultas por padrão nas árvores e são exibidas com linha pontilhada quando ativadas.")}</p>
            <p><b className="text-fg">{t("Campos vazios:")}</b> {t("quando não há fonte confiável, o campo aparece como “Não documentado”.")}</p>
          </div>
        </Section>

        <Section title={t("Revisão dos registros")}>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(REVIEW_STATUSES).map(([k, s]) => (
              <div key={k} className="card p-4">
                <Pill color={s.color}>{t(s.label)}</Pill>
                <p className="mt-2 text-sm text-muted">{t(s.long)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("Linhas da árvore evolutiva")}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(EVOLUTION_KINDS).map(([k, v]) => (
              <div key={k} className="card flex items-start gap-3 p-3">
                <svg width="34" height="10" className="mt-1.5 shrink-0"><line x1="0" y1="5" x2="34" y2="5" stroke={v.color} strokeWidth="3" /></svg>
                <div><div className="text-sm font-semibold">{t(v.label)}</div><div className="text-xs text-muted">{t(v.description)}</div></div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("Fontes cadastradas")} description={t("Prioridade: Digimon Reference Book e materiais oficiais, depois Wikimon. Além destas, há {n} fontes específicas por obra.", { n: mediaSources })}>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted">{t(SOURCE_KINDS[s.kind as SourceKind] ?? s.kind)}{s.publisher ? ` · ${t(s.publisher)}` : ""}</div>
                  </div>
                  {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="btn btn-ghost px-2 py-1 text-xs"><ExternalLink size={13} /> {t("Abrir")}</a>}
                </div>
                {s.notes && <p className="mt-2 text-sm text-muted">{td(s.notes)}</p>}
                <div className="mt-2 text-xs text-muted">
                  {t("Usada em {a} citações · {b} evoluções · {c} contextos/aparições", { a: s._count.citations, b: s._count.evolutions, c: s._count.evolutionContexts + s._count.appearances })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </Container>
    </div>
  );
}
